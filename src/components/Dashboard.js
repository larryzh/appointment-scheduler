import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../supabaseClient';
import './Dashboard.css';

function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [lists, setLists] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newListName, setNewListName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [error, setError] = useState(null);
  const userEmail = localStorage.getItem('userEmail');
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
        .order('created_at');

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

  const addGroup = async (e) => {
    e.preventDefault();
    try {
      if (!newGroupName.trim()) return;

      const { data, error } = await supabase
        .from('groups')
        .insert([{ name: newGroupName.trim(), user_id: userId }])
        .select();

      if (error) throw error;

      setGroups([...groups, data[0]]);
      setNewGroupName('');
    } catch (error) {
      setError(error.message);
    }
  };

  const editGroup = async (e, groupId, newName) => {
    e.stopPropagation(); // Prevent group selection when clicking edit
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
    e.stopPropagation(); // Prevent group selection when clicking remove
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
      if (type === 'LIST') {
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
    <div className="dashboard">
      <header>
        <h1>Welcome, {userEmail}</h1>
        <button onClick={() => {
          localStorage.clear();
          window.location.href = '/login';
        }}>Logout</button>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="groups-section">
        <h2>Groups</h2>
        <form onSubmit={addGroup}>
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New group name"
          />
          <button type="submit">Add Group</button>
        </form>

        <div className="groups-list">
          {groups.map(group => (
            <div 
              key={group.id} 
              className={`group-item ${selectedGroup?.id === group.id ? 'selected' : ''}`}
              onClick={() => handleGroupSelect(group)}
            >
              <span>{group.name}</span>
              <div className="group-actions">
                <button onClick={(e) => {
                  const newName = prompt('Enter new name:', group.name);
                  if (newName) editGroup(e, group.id, newName);
                }}>Edit</button>
                <button onClick={(e) => removeGroup(e, group.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedGroup && (
        <div className="lists-section">
          <h2>Lists for {selectedGroup.name}</h2>
          <form onSubmit={addList}>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="New list name"
            />
            <button type="submit">Add List</button>
          </form>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="lists" direction="horizontal" type="LIST">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="lists-container"
                >
                  {lists.map((list, index) => (
                    <Draggable
                      key={list.id}
                      draggableId={list.id.toString()}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="list"
                        >
                          <div className="list-header" {...provided.dragHandleProps}>
                            <h3>{list.name}</h3>
                            <div className="list-actions">
                              <button onClick={() => {
                                const newName = prompt('Enter new name:', list.name);
                                if (newName) editList(list.id, newName);
                              }}>Edit</button>
                              <button onClick={() => removeList(list.id)}>Remove</button>
                            </div>
                          </div>

                          <Droppable droppableId={list.id.toString()} type="SYMBOL">
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="symbols-container"
                              >
                                {(list.symbols || []).map((symbol, index) => (
                                  <Draggable
                                    key={symbol.id}
                                    draggableId={symbol.id.toString()}
                                    index={index}
                                  >
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="symbol"
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
      )}
    </div>
  );
}

export default Dashboard;
