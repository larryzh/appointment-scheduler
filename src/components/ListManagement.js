import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../supabaseClient';
import './ListManagement.css';

function ListManagement() {
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
      // First create a copy of the group
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert([{ 
          name: `${group.name} (Copy)`, 
          user_id: userId,
          position: groups.length 
        }])
        .select();

      if (groupError) throw groupError;

      // Fetch all lists from the original group
      const { data: originalLists, error: listsError } = await supabase
        .from('lists')
        .select('*')
        .eq('group_id', group.id);

      if (listsError) throw listsError;

      // Create copies of all lists with their symbols
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

      // Refresh the groups list
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
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      setGroups(groups.filter(group => group.id !== groupId));
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setLists([]);
      }
    } catch (error) {
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
    const { source, destination, type } = result;

    if (!destination) return;

    try {
      if (type === 'GROUP') {
        const newGroups = Array.from(groups);
        const [removed] = newGroups.splice(source.index, 1);
        newGroups.splice(destination.index, 0, removed);

        setGroups(newGroups);

        // Update positions in database
        const updates = newGroups.map((group, index) => 
          supabase
            .from('groups')
            .update({ position: index })
            .eq('id', group.id)
        );

        await Promise.all(updates);
      } else if (type === 'LIST' && source.droppableId === 'all-lists' && destination.droppableId === 'all-lists') {
        const newLists = Array.from(lists);
        const [removed] = newLists.splice(source.index, 1);
        newLists.splice(destination.index, 0, removed);

        setLists(newLists);

        // Update positions in database
        const updates = newLists.map((list, index) => 
          supabase
            .from('lists')
            .update({ position: index })
            .eq('id', list.id)
        );

        await Promise.all(updates);
      } else if (type === 'SYMBOL') {
        const sourceList = lists.find(l => l.id.toString() === source.droppableId);
        const destList = lists.find(l => l.id.toString() === destination.droppableId);

        if (sourceList && destList) {
          const sourceSymbols = Array.from(sourceList.symbols || []);
          const destSymbols = source.droppableId === destination.droppableId 
            ? sourceSymbols 
            : Array.from(destList.symbols || []);

          const [movedSymbol] = sourceSymbols.splice(source.index, 1);
          destSymbols.splice(destination.index, 0, movedSymbol);

          const newLists = lists.map(list => {
            if (list.id === sourceList.id) {
              return { ...list, symbols: sourceSymbols };
            }
            if (list.id === destList.id) {
              return { ...list, symbols: destSymbols };
            }
            return list;
          });

          setLists(newLists);

          // Update both lists in database
          await supabase
            .from('lists')
            .update({ symbols: sourceSymbols })
            .eq('id', sourceList.id);

          if (source.droppableId !== destination.droppableId) {
            await supabase
              .from('lists')
              .update({ symbols: destSymbols })
              .eq('id', destList.id);
          }
        }
      }
    } catch (error) {
      setError(error.message);
      // Refresh lists on error
      if (selectedGroup) {
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
                      >
                        <span>{group.name}</span>
                        <div className="group-actions">
                          <button onClick={(e) => copyGroup(e, group)}>Copy</button>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            const newName = prompt('Enter new name:', group.name);
                            if (newName) editGroup(e, group.id, newName);
                          }}>Edit</button>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            removeGroup(e, group.id);
                          }}>×</button>
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
              <h2>Lists for {selectedGroup.name}</h2>
              <form className="add-form" onSubmit={addList}>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="New list name"
                />
                <button type="submit">+</button>
              </form>

              <Droppable droppableId="all-lists" direction="horizontal" type="LIST">
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

                            <Droppable droppableId={list.id.toString()} type="SYMBOL">
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`symbols-container ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                >
                                  {(list.symbols || []).map((symbol, index) => (
                                    <Draggable
                                      key={symbol.id}
                                      draggableId={symbol.id.toString()}
                                      index={index}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`symbol ${snapshot.isDragging ? 'dragging' : ''}`}
                                        >
                                          <span>{symbol.content}</span>
                                          <button onClick={() => removeSymbol(list.id, symbol.id)}>×</button>
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

export default ListManagement;
