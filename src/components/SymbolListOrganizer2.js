import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './SymbolListManager.css';

const SymbolListOrganizer = () => {
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');

  const addList = () => {
    if (newListName.trim() !== '') {
      const newList = {
        id: `list-${Date.now()}`,
        name: newListName,
        symbols: []
      };
      setLists([...lists, newList]);
      setNewListName('');
    }
  };

  const addSymbol = (listId) => {
    if (newSymbol.trim() !== '') {
      const updatedLists = lists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            symbols: [...list.symbols, newSymbol]
          };
        }
        return list;
      });
      setLists(updatedLists);
      setNewSymbol('');
    }
  };

  const onDragEnd = (result) => {
    const { source, destination, type } = result;

    if (!destination) {
      return;
    }

    if (type === 'LIST') {
      const newLists = Array.from(lists);
      const [reorderedItem] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, reorderedItem);
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

        setLists(newLists);
      }
    }
  };

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
                                key={`${list.id}-${symbolIndex}`}
                                draggableId={`${list.id}-${symbolIndex}`}
                                index={symbolIndex}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`symbol ${snapshot.isDragging ? 'dragging' : ''}`}
                                  >
                                    {symbol}
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
