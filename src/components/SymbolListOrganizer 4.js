import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../supabaseClient';
import './SymbolListManager.css';

const SymbolListOrganizer = ({ userId }) => {
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');

  useEffect(() => {
    fetchLists();
  }, [userId]);

  useEffect(() => {
    console.log('Lists state updated:', lists);
  }, [lists]);

  const fetchLists = async () => {
    const { data, error } = await supabase
      .from('symbol_lists')
      .select('*')
      .eq('user_id', userId)
      .order('position');

    if (error) {
      console.error('Error fetching lists:', error);
    } else {
      console.log('Fetched lists:', data);
      const listsWithValidSymbols = data.map(list => ({
        ...list,
        id: list.id.toString(), // Ensure ID is a string
        symbols: (list.symbols || []).map((symbol, index) => {
          if (typeof symbol === 'string') {
            return { id: `${list.id}-${index}`, content: symbol };
          }
          return symbol.id ? { ...symbol, id: symbol.id.toString() } : { ...symbol, id: `${list.id}-${index}` };
        })
      }));
      setLists(listsWithValidSymbols || []);
    }
  };

  const addList = async () => {
    if (newListName.trim() !== '') {
      const newList = {
        name: newListName,
        symbols: [],
        user_id: userId,
        position: lists.length
      };

      const { data, error } = await supabase
        .from('symbol_lists')
        .insert(newList)
        .select();

      if (error) {
        console.error('Error adding list:', error);
      } else {
        console.log('Added new list:', data[0]);
        setLists([...lists, { ...data[0], id: data[0].id.toString(), symbols: [] }]);
        setNewListName('');
      }
    }
  };

  const addSymbol = async (listId) => {
    if (newSymbol.trim() !== '') {
      const listToUpdate = lists.find(list => list.id === listId);
      const newSymbolObject = { id: `${listId}-${Date.now()}`, content: newSymbol };
      const updatedSymbols = [...listToUpdate.symbols, newSymbolObject];

      const { error } = await supabase
        .from('symbol_lists')
        .update({ symbols: updatedSymbols })
        .eq('id', listId);

      if (error) {
        console.error('Error adding symbol:', error);
      } else {
        const updatedLists = lists.map(list =>
          list.id === listId ? { ...list, symbols: updatedSymbols } : list
        );
        console.log('Updated lists after adding symbol:', updatedLists);
        setLists(updatedLists);
        setNewSymbol('');
      }
    }
  };

  const onDragEnd = useCallback(async (result) => {
    console.log('Drag ended:', result);
    const { source, destination, type, draggableId } = result;

    if (!destination) {
      return;
    }

    try {
      if (type === 'LIST') {
        const newLists = Array.from(lists);
        const [reorderedItem] = newLists.splice(source.index, 1);
        newLists.splice(destination.index, 0, reorderedItem);

        // Update positions in Supabase
        for (let i = 0; i < newLists.length; i++) {
          await supabase
            .from('symbol_lists')
            .update({ position: i })
            .eq('id', newLists[i].id);
        }

        console.log('Reordered lists:', newLists);
        setLists(newLists);
      } else if (type === 'SYMBOL') {
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

          // Update symbols in Supabase
          await supabase
            .from('symbol_lists')
            .update({ symbols: sourceSymbols })
            .eq('id', sourceList.id);

          if (sourceList.id !== destList.id) {
            await supabase
              .from('symbol_lists')
              .update({ symbols: destSymbols })
              .eq('id', destList.id);
          }

          console.log('Updated lists after moving symbol:', newLists);
          setLists(newLists);
        }
      }
    } catch (error) {
      console.error('Error in onDragEnd:', error);
      console.error('Drag result:', result);
      console.error('Current lists state:', lists);
    }
  }, [lists]);

  return (
    <div className="symbol-list-organizer">
      <h2>Symbol List Organizer</h2>
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
        <Droppable droppableId="all-lists" type="LIST" direction="horizontal">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="lists-container">
              {lists.map((list, index) => (
                <Draggable key={list.id} draggableId={list.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`list-container ${snapshot.isDragging ? 'dragging' : ''}`}
                    >
                      <div className="list-header" {...provided.dragHandleProps}>
                        <h3>{list.name}</h3>
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
                                    {symbol.content}
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
