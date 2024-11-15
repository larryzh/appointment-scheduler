import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';

const ListGroup = ({ group, lists, onAddSymbol, onDeleteSymbol, newSymbol, setNewSymbol }) => {
  return (
    <div className="list-group">
      <h2 className="group-title">{group.name}</h2>
      <Droppable droppableId={`group-${group.id}`} type="LIST" direction="horizontal">
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
                                  <span>{symbol.content}</span>
                                  <button 
                                    onClick={() => onDeleteSymbol(list.id, symbol.id)}
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
                      <button onClick={() => onAddSymbol(list.id)}>Add Symbol</button>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default ListGroup;
