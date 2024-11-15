import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../supabaseClient';
import './SymbolListManager.css';

const SymbolListManager = ({ userId }) => {
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');

  useEffect(() => {
    fetchLists();
  }, [userId]);

  const fetchLists = async () => {
    const { data, error } = await supabase
      .from('symbol_lists')
      .select('*')
      .eq('user_id', userId)
      .order('position');

    if (error) {
      console.error('Error fetching lists:', error);
    } else {
      setLists(data || []);
    }
  };

  const addList = async () => {
    if (newListName.trim() === '') return;

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
      setLists([...lists, data[0]]);
      setNewListName('');
    }
  };

  const updateList = async (listId, newName) => {
    const { error } = await supabase
      .from('symbol_lists')
      .update({ name: newName })
      .eq('id', listId);

    if (error) {
      console.error('Error updating list:', error);
    } else {
      setLists(lists.map(list => list.id === listId ? { ...list, name: newName } : list));
    }
  };

  const deleteList = async (listId) => {
    const { error } = await supabase
      .from('symbol_lists')
      .delete()
      .eq('id', listId);

    if (error) {
      console.error('Error deleting list:', error);
    } else {
      setLists(lists.filter(list => list.id !== listId));
    }
  };

  const addSymbol = async (listId) => {
    if (newSymbol.trim() === '') return;

    const listIndex = lists.findIndex(l => l.id === listId);
    const updatedList = { ...lists[listIndex] };
    updatedList.symbols = [...updatedList.symbols, newSymbol];

    const { error } = await supabase
      .from('symbol_lists')
      .update({ symbols: updatedList.symbols })
      .eq('id', listId);

    if (error) {
      console.error('Error adding symbol:', error);
    } else {
      const newLists = [...lists];
      newLists[listIndex] = updatedList;
      setLists(newLists);
      setNewSymbol('');
    }
  };

  const removeSymbol = async (listId, symbolIndex) => {
    const listIndex = lists.findIndex(l => l.id === listId);
    const updatedList = { ...lists[listIndex] };
    updatedList.symbols = updatedList.symbols.filter((_, index) => index !== symbolIndex);

    const { error } = await supabase
      .from('symbol_lists')
      .update({ symbols: updatedList.symbols })
      .eq('id', listId);

    if (error) {
      console.error('Error removing symbol:', error);
    } else {
      const newLists = [...lists];
      newLists[listIndex] = updatedList;
      setLists(newLists);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, type } = result;

    if (!destination) return;

    if (type === 'LIST') {
      const newLists = Array.from(lists);
      const [reorderedItem] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, reorderedItem);

      setLists(newLists);

      // Update positions in Supabase
      for (let i = 0; i < newLists.length; i++) {
        await supabase
          .from('symbol_lists')
          .update({ position: i })
          .eq('id', newLists[i].id);
      }
    } else if (type === 'SYMBOL') {
      const sourceList = lists.find(list => list.id === parseInt(source.droppableId));
      const destList = lists.find(list => list.id === parseInt(destination.droppableId));

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
      }
    }
  };

  return (
    <div className="symbol-list-manager">
      <h2>Symbol List Manager</h2>
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
                <Draggable key={list.id} draggableId={list.id.toString()} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="list-container"
                    >
                      <div className="list-header" {...provided.dragHandleProps}>
                        <h3>{list.name}</h3>
                        <div className="list-actions">
                          <button onClick={() => updateList(list.id, prompt('Enter new name:', list.name))}>Edit</button>
                          <button onClick={() => deleteList(list.id)}>Delete</button>
                        </div>
                      </div>
                      <Droppable droppableId={list.id.toString()} type="SYMBOL">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="symbol-list"
                          >
                            {list.symbols.map((symbol, symbolIndex) => (
                              <Draggable
                                key={`${list.id}-${symbolIndex}`}
                                draggableId={`${list.id}-${symbolIndex}`}
                                index={symbolIndex}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="symbol"
                                  >
                                    {symbol}
                                    <button onClick={() => removeSymbol(list.id, symbolIndex)}>Remove</button>
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

export default SymbolListManager;
