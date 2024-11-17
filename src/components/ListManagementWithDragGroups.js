import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../supabaseClient';
import './ListManagement.css';

function ListManagementWithDragGroups() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [lists, setLists] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newListName, setNewListName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [error, setError] = useState(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) {
      fetchGroups();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedGroup) {
      fetchLists();
    } else {
      setLists([]);
    }
  }, [selectedGroup]);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', userId)
        .order('position');

      if (error) throw error;
      setGroups(data);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchLists = async () => {
    try {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('group_id', selectedGroup.id)
        .order('position');

      if (error) throw error;
      setLists(data || []);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGroupSelect = (group) => {
    if (selectedGroup?.id === group.id) {
      setSelectedGroup(null);
      setLists([]);
    } else {
      setSelectedGroup(group);
    }
  };

  const copyGroup = async (e, group) => {
    e.stopPropagation();
    try {
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert([{ 
          name: `${group.name} (Copy)`, 
          user_id: userId,
          position: groups.length 
        }])
        .select();

      if (groupError) throw groupError;

      const { data: originalLists, error: listsError } = await supabase
        .from('lists')
        .select('*')
        .eq('group_id', group.id);

      if (listsError) throw listsError;

      if (originalLists) {
        const listCopies = originalLists.map(list => ({
          name: list.name,
          group_id: newGroup[0].id,
          position: list.position,
          symbols: list.symbols
        }));

        const { error: copyError } = await supabase
          .from('lists')
          .insert(listCopies);

        if (copyError) throw copyError;
      }

      fetchGroups();
    } catch (error) {
      setError(error.message);
    }
  };

  const addGroup = async (e) => {
    e.preventDefault();
    try {
      if (!newGroupName.trim()) return;

      const { data, error } = await supabase
        .from('groups')
        .insert([{ 
          name: newGroupName.trim(), 
          user_id: userId,
          position: groups.length 
        }])
        .select();

      if (error) throw error;

      setGroups([...groups, data[0]]);
      setNewGroupName('');
    } catch (error) {
      setError(error.message);
    }
  };

  const editGroup = async (e, groupId, newName) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('groups')
        .update({ name: newName })
        .eq('id', groupId);

      if (error) throw error;

      setGroups(groups.map(group => 
        group.id === groupId ? { ...group, name: newName } : group
      ));
    } catch (error) {
      setError(error.message);
    }
  };

  const removeGroup = async (e, groupId) => {
    e.stopPropagation();
    try {
      const { error: listsError } = await supabase
        .from('lists')
        .delete()
        .eq('group_id', groupId);

      if (listsError) throw listsError;

      const { error: groupError } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (groupError) throw groupError;

      setGroups(groups.filter(group => group.id !== groupId));
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setLists([]);
      }

      const updatedGroups = groups
        .filter(group => group.id !== groupId)
        .map((group, index) => ({
          ...group,
          position: index
        }));

      const updates = updatedGroups.map(group => 
        supabase
          .from('groups')
          .update({ position: group.position })
          .eq('id', group.id)
      );

      await Promise.all(updates);
      
      fetchGroups();
    } catch (error) {
      console.error('Error removing group:', error);
      setError(error.message);
    }
  };

  const addList = async (e) => {
    e.preventDefault();
    try {
      if (!newListName.trim() || !selectedGroup) return;

      const { data, error } = await supabase
        .from('lists')
        .insert([{
          name: newListName.trim(),
          group_id: selectedGroup.id,
          position: lists.length,
          symbols: []
        }])
        .select();

      if (error) throw error;

      setLists([...lists, data[0]]);
      setNewListName('');
    } catch (error) {
      setError(error.message);
    }
  };

  const editList = async (listId, newName) => {
    try {
      const { error } = await supabase
        .from('lists')
        .update({ name: newName })
        .eq('id', listId);

      if (error) throw error;

      setLists(lists.map(list => 
        list.id === listId ? { ...list, name: newName } : list
      ));
    } catch (error) {
      setError(error.message);
    }
  };

  const removeList = async (listId) => {
    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;

      setLists(lists.filter(list => list.id !== listId));
    } catch (error) {
      setError(error.message);
    }
  };

  const addSymbol = async (listId) => {
    try {
      if (!newSymbol.trim()) return;

      const list = lists.find(l => l.id === listId);
      const updatedSymbols = [...(list.symbols || []), { id: Date.now().toString(), content: newSymbol }];

      const { error } = await supabase
        .from('lists')
        .update({ symbols: updatedSymbols })
        .eq('id', listId);

      if (error) throw error;

      setLists(lists.map(list =>
        list.id === listId ? { ...list, symbols: updatedSymbols } : list
      ));
      setNewSymbol('');
    } catch (error) {
      setError(error.message);
    }
  };

  const removeSymbol = async (listId, symbolId) => {
    try {
      const list = lists.find(l => l.id === listId);
      const updatedSymbols = list.symbols.filter(symbol => symbol.id !== symbolId);

      const { error } = await supabase
        .from('lists')
        .update({ symbols: updatedSymbols })
        .eq('id', listId);

      if (error) throw error;

      setLists(lists.map(list =>
        list.id === listId ? { ...list, symbols: updatedSymbols } : list
      ));
    } catch (error) {
      setError(error.message);
    }
  };

  const onDragEnd = async (result) => {
    console.log('Drag end result:', result);

    if (!result.destination) {
      console.log('No destination');
      return;
    }

    const { source, destination, type } = result;

    // If dropped in same spot
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      console.log('Dropped in same spot');
      return;
    }

    try {
      if (type === 'GROUP') {
        console.log('Reordering groups...');
        const newGroups = Array.from(groups);
        const [removed] = newGroups.splice(source.index, 1);
        newGroups.splice(destination.index, 0, removed);

        console.log('Setting new groups order:', newGroups);
        setGroups(newGroups);

        console.log('Updating group positions in database...');
        await Promise.all(
          newGroups.map((group, index) => 
            supabase
              .from('groups')
              .update({ position: index })
              .eq('id', group.id)
          )
        );
        console.log('Group positions updated');
      } else if (type === 'LIST') {
        console.log('Reordering lists...');
        const newLists = Array.from(lists);
        const [removed] = newLists.splice(source.index, 1);
        newLists.splice(destination.index, 0, removed);

        console.log('Setting new lists order:', newLists);
        setLists(newLists);

        console.log('Updating list positions in database...');
        await Promise.all(
          newLists.map((list, index) => 
            supabase
              .from('lists')
              .update({ position: index })
              .eq('id', list.id)
          )
        );
        console.log('List positions updated');
      } else if (type === 'SYMBOL') {
        console.log('Moving symbol...');
        const sourceListId = source.droppableId.replace('symbols-', '');
        const destListId = destination.droppableId.replace('symbols-', '');
        
        const sourceList = lists.find(l => l.id.toString() === sourceListId);
        const destList = sourceListId === destListId 
          ? sourceList 
          : lists.find(l => l.id.toString() === destListId);

        if (sourceList && destList) {
          const sourceSymbols = Array.from(sourceList.symbols || []);
          const destSymbols = sourceListId === destListId 
            ? sourceSymbols 
            : Array.from(destList.symbols || []);

          const [movedSymbol] = sourceSymbols.splice(source.index, 1);
          destSymbols.splice(destination.index, 0, movedSymbol);

          const newLists = lists.map(list => {
            if (list.id.toString() === sourceListId) {
              return { ...list, symbols: sourceSymbols };
            }
            if (list.id.toString() === destListId) {
              return { ...list, symbols: destSymbols };
            }
            return list;
          });

          console.log('Setting new lists state:', newLists);
          setLists(newLists);

          console.log('Updating lists in database...');
          await Promise.all([
            supabase
              .from('lists')
              .update({ symbols: sourceSymbols })
              .eq('id', sourceListId),
            ...(sourceListId !== destListId ? [
              supabase
                .from('lists')
                .update({ symbols: destSymbols })
                .eq('id', destListId)
            ] : [])
          ]);
          console.log('Lists updated in database');
        }
      }
    } catch (error) {
      console.error('Error in drag end:', error);
      setError(error.message);
      if (type === 'GROUP') {
        fetchGroups();
      } else if (type === 'LIST' || type === 'SYMBOL') {
        fetchLists();
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="list-management">
        <div className="groups-section">
          <h2>Groups</h2>
          <form className="add-form" onSubmit={addGroup}>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group name"
            />
            <button type="submit">+</button>
          </form>

          <Droppable droppableId="groups-list" type="GROUP">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`groups-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                style={{ minHeight: '50px' }}
              >
                {groups.map((group, index) => (
                  <Draggable
                    key={group.id}
                    draggableId={group.id.toString()}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`group-item ${selectedGroup?.id === group.id ? 'selected' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
                        onClick={() => handleGroupSelect(group)}
                        style={{
                          ...provided.draggableProps.style,
                          cursor: snapshot.isDragging ? 'grabbing' : 'grab'
                        }}
                      >
                        <span>{group.name}</span>
                        <div 
                          className="group-actions"
                          onClick={e => e.stopPropagation()}
                        >
                          <button onClick={(e) => copyGroup(e, group)}>
                            Copy
                          </button>
                          <button onClick={(e) => {
                            const newName = prompt('Enter new name:', group.name);
                            if (newName) editGroup(e, group.id, newName);
                          }}>
                            Edit
                          </button>
                          <button onClick={(e) => {
                            if (window.confirm('Are you sure you want to delete this group?')) {
                              removeGroup(e, group.id);
                            }
                          }}>
                            ×
                          </button>
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

        <div className="lists-section">
          {selectedGroup ? (
            <>
              <div className="lists-header">
                <div className="header-content">
                  <span className="current-date">{formatDate(new Date())}</span>
                  <h2>Lists for {selectedGroup.name}</h2>
                </div>
              </div>
              <form className="add-form" onSubmit={addList}>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="New list name"
                />
                <button type="submit">+</button>
              </form>

              <Droppable droppableId="lists-container" type="LIST" direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`lists-container ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {lists.map((list, index) => (
                      <Draggable
                        key={list.id}
                        draggableId={list.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`list ${snapshot.isDragging ? 'dragging' : ''}`}
                          >
                            <div className="list-header" {...provided.dragHandleProps}>
                              <h3>{list.name}</h3>
                              <div className="list-actions">
                                <button onClick={() => {
                                  const newName = prompt('Enter new name:', list.name);
                                  if (newName) editList(list.id, newName);
                                }}>Edit</button>
                                <button onClick={() => removeList(list.id)}>×</button>
                              </div>
                            </div>

                            <Droppable droppableId={`symbols-${list.id}`} type="SYMBOL">
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`symbols-container ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                >
                                  {(list.symbols || []).map((symbol, index) => (
                                    <Draggable
                                      key={symbol.id}
                                      draggableId={`symbol-${symbol.id}`}
                                      index={index}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`symbol ${snapshot.isDragging ? 'dragging' : ''}`}
                                          style={{
                                            ...provided.draggableProps.style,
                                            cursor: snapshot.isDragging ? 'grabbing' : 'grab'
                                          }}
                                        >
                                          <span>{symbol.content}</span>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeSymbol(list.id, symbol.id);
                                            }}
                                          >×</button>
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
                              <button onClick={() => addSymbol(list.id)}>+</button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </>
          ) : (
            <div className="no-selection">
              <h2>Select a group to manage lists</h2>
            </div>
          )}
        </div>
      </div>
    </DragDropContext>
  );
}

export default ListManagementWithDragGroups;
