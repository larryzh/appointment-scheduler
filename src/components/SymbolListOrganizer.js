import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../supabaseClient';
import './SymbolListManager.css';

const SymbolListOrganizer = () => {
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [editingListId, setEditingListId] = useState(null);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    const { data, error } = await supabase
      .from('symbol_lists')
      .select('*')
      .order('position');

    if (error) {
      console.error('Error fetching lists:', error);
    } else {
      const listsWithValidSymbols = data.map(list => ({
        ...list,
        id: list.id.toString(),
        symbols: (list.symbols || []).map((symbol, index) => ({
          id: `${list.id}-${index}`,
          content: symbol
        }))
      }));
      setLists(listsWithValidSymbols || []);
    }
  };

  const addList = async () => {
    if (newListName.trim() !== '') {
      const newList = {
        name: newListName,
        symbols: [],
        position: lists.length
      };

      const { data, error } = await supabase
        .from('symbol_lists')
        .insert(newList)
        .select();

      if (error) {
        console.error('Error adding list:', error);
      } else {
        setLists([...lists, { ...data[0], id: data[0].id.toString(), symbols: [] }]);
        setNewListName('');
      }
    }
  };

  const updateListName = async (listId, newName) => {
    if (newName.trim() !== '') {
      const { error } = await supabase
        .from('symbol_lists')
        .update({ name: newName })
        .eq('id', listId);

      if (error) {
        console.error('Error updating list name:', error);
      } else {
        const updatedLists = lists.map(list =>
          list.id === listId ? { ...list, name: newName } : list
        );
        setLists(updatedLists);
      }
    }
    setEditingListId(null);
  };

  const deleteList = async (listId) => {
    const { error } = await supabase
      .from('symbol_lists')
      .delete()
      .eq('id', listId);

    if (error) {
      console.error('Error deleting list:', error);
    } else {
      const updatedLists = lists.filter(list => list.id !== listId);
      setLists(updatedLists);
    }
  };

  const addSymbol = async (listId) => {
    if (newSymbol.trim() !== '') {
      const listToUpdate = lists.find(list => list.id === listId);
      const newSymbolObject = { id: `${listId}-${Date.now()}`, content: newSymbol };
      const updatedSymbols = [...listToUpdate.symbols, newSymbolObject];

      const symbolsForDb = updatedSymbols.map(symbol => symbol.content);

      const { error } = await supabase
        .from('symbol_lists')
        .update({ symbols: symbolsForDb })
        .eq('id', listId);

      if (error) {
        console.error('Error adding symbol:', error);
      } else {
        const updatedLists = lists.map(list =>
          list.id === listId ? { ...list, symbols: updatedSymbols } : list
        );
        setLists(updatedLists);
        setNewSymbol('');
      }
    }
  };

  const deleteSymbol = async (listId, symbolId) => {
    const listToUpdate = lists.find(list => list.id === listId);
    const updatedSymbols = listToUpdate.symbols.filter(symbol => symbol.id !== symbolId);

    const symbolsForDb = updatedSymbols.map(symbol => symbol.content);

    const { error } = await supabase
      .from('symbol_lists')
      .update({ symbols: symbolsForDb })
      .eq('id', listId);

    if (error) {
      console.error('Error deleting symbol:', error);
    } else {
      const updatedLists = lists.map(list =>
        list.id === listId ? { ...list, symbols: updatedSymbols } : list
      );
      setLists(updatedLists);
    }
  };

  const onDragEnd = useCallback(async (result) => {
    const { source, destination, type } = result;

    if (!destination) {
      return;
    }

    try {
      if (type === 'LIST') {
        const newLists = Array.from(lists);
        const [reorderedItem] = newLists.splice(source.index, 1);
        newLists.splice(destination.index, 0, reorderedItem);

        setLists(newLists);

        const updates = newLists.map((list, index) => 
          supabase
            .from('symbol_lists')
            .update({ position: index })
            .eq('id', list.id)
        );

        await Promise.all(updates);
      } else {
        const sourceList = lists.find(list => list.id === source.droppableId);
        const destList = lists.find(list => list.id === destination.droppableId);

        if (sourceList && destList) {
          const sourceSymbols = Array.from(sourceList.symbols);
          const destSymbols = sourceList === destList ? sourceSymbols : Array.from(destList.symbols);
          const [movedSymbol] = sourceSymbols.splice(source.index, 1);
          destSymbols.splice(destination.index, 0, movedSymbol);

          const newLists = lists.map(list => {
            if (list.id === sourceList.id) {
              return { ...list, symbols: sourceSymbols };
            } else if (list.id === destList.id) {
              return { ...list, symbols: destSymbols };
            }
            return list;
          });

          setLists(newLists);

          const sourceSymbolsForDb = sourceSymbols.map(symbol => symbol.content);
          const destSymbolsForDb = destSymbols.map(symbol => symbol.content);

          await supabase
            .from('symbol_lists')
            .update({ symbols: sourceSymbolsForDb })
            .eq('id', sourceList.id);

          if (sourceList.id !== destList.id) {
            await supabase
              .from('symbol_lists')
              .update({ symbols: destSymbolsForDb })
              .eq('id', destList.id);
          }
        }
      }
    } catch (error) {
      console.error('Error in onDragEnd:', error);
      fetchLists();
    }
  }, [lists]);

  return (
    <div className="symbol-list-organizer">
      <div className="add-list-form">
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list name"
        />
        <button onClick={addList}>Add List</button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="lists" type="LIST" direction="horizontal">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`lists-container ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            >
              {lists.map((list, index) => (
                <Draggable key={list.id} draggableId={list.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`list-container ${snapshot.isDragging ? 'dragging' : ''}`}
                    >
                      <div className="list-header" {...provided.dragHandleProps}>
                        <div className="list-title">
                          {editingListId === list.id ? (
                            <input
                              type="text"
                              value={list.name}
                              onChange={(e) => {
                                const updatedLists = lists.map(l =>
                                  l.id === list.id ? { ...l, name: e.target.value } : l
                                );
                                setLists(updatedLists);
                              }}
                              onBlur={() => updateListName(list.id, list.name)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateListName(list.id, list.name);
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <h3>{list.name}</h3>
                          )}
                        </div>
                        <div className="list-actions">
                          <button
                            onClick={() => setEditingListId(list.id)}
                            className="edit-button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteList(list.id)}
                            className="delete-button"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <Droppable droppableId={list.id} type="SYMBOL">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`symbol-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                          >
                            {list.symbols.map((symbol, symbolIndex) => (
                              <Draggable
                                key={symbol.id}
                                draggableId={symbol.id}
                                index={symbolIndex}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`symbol ${snapshot.isDragging ? 'dragging' : ''}`}
                                  >
                                    <span>{symbol.content}</span>
                                    <button 
                                      onClick={() => deleteSymbol(list.id, symbol.id)}
                                      className="delete-button"
                                    >
                                      ×
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                      <div className="add-symbol-form">
                        <input
                          type="text"
                          value={newSymbol}
                          onChange={(e) => setNewSymbol(e.target.value)}
                          placeholder="New symbol"
                        />
                        <button onClick={() => addSymbol(list.id)}>Add Symbol</button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default SymbolListOrganizer;
