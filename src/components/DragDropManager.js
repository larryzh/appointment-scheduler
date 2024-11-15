import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './SymbolListManager.css';

const DragDropManager = () => {
  const [lists, setLists] = useState([
    { id: 'list1', name: 'List 1' },
    { id: 'list2', name: 'List 2' },
    { id: 'list3', name: 'List 3' },
  ]);

  const onDragStart = (start) => {
    console.log('Drag started:', start);
  };

  const onDragUpdate = (update) => {
    console.log('Drag update:', update);
  };

  const onDragEnd = (result) => {
    console.log('Drag ended:', result);
    const { source, destination } = result;

    if (!destination) {
      console.log('No destination, drag cancelled');
      return;
    }

    console.log('Reordering list');
    const newLists = Array.from(lists);
    const [reorderedItem] = newLists.splice(source.index, 1);
    newLists.splice(destination.index, 0, reorderedItem);
    console.log('New lists order:', newLists.map(l => l.name));
    setLists(newLists);
  };

  return (
    <div className="drag-drop-manager">
      <h2>Drag and Drop Manager</h2>
      <DragDropContext onDragStart={onDragStart} onDragUpdate={onDragUpdate} onDragEnd={onDragEnd}>
        <Droppable droppableId="all-lists" direction="horizontal">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="lists-container">
              {lists.map((list, index) => (
                <Draggable key={list.id} draggableId={list.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`list-container ${snapshot.isDragging ? 'dragging' : ''}`}
                      style={{
                        ...provided.draggableProps.style,
                        border: '1px solid black',
                        padding: '10px',
                        margin: '10px',
                        background: 'white'
                      }}
                    >
                      <h3>{list.name}</h3>
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

export default DragDropManager;
