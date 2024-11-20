import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../supabaseClient';
import './ListManagement.css';

function ListManagementWithDragGroups() {
  const [sections, setSections] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [lists, setLists] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newListName, setNewListName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [error, setError] = useState(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) {
      fetchSections();
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

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('user_id', userId)
        .order('position');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', userId)
        .order('position');

      if (error) throw error;
      setGroups(data || []);
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

  const addSection = async (e) => {
    e.preventDefault();
    try {
      if (!newSectionName.trim()) return;

      const { data, error } = await supabase
        .from('sections')
        .insert([{
          name: newSectionName.trim(),
          user_id: userId,
          position: sections.length,
          color: '#' + Math.floor(Math.random()*16777215).toString(16),
          is_expanded: true
        }])
        .select();

      if (error) throw error;

      setSections([...sections, data[0]]);
      setNewSectionName('');
    } catch (error) {
      setError(error.message);
    }
  };

  const editSection = async (sectionId, newName) => {
    try {
      const { error } = await supabase
        .from('sections')
        .update({ name: newName })
        .eq('id', sectionId);

      if (error) throw error;

      setSections(sections.map(section =>
        section.id === sectionId ? { ...section, name: newName } : section
      ));
    } catch (error) {
      setError(error.message);
    }
  };

  const toggleSection = async (sectionId) => {
    try {
      const section = sections.find(s => s.id === sectionId);
      const { error } = await supabase
        .from('sections')
        .update({ is_expanded: !section.is_expanded })
        .eq('id', sectionId);

      if (error) throw error;

      setSections(sections.map(section =>
        section.id === sectionId ? { ...section, is_expanded: !section.is_expanded } : section
      ));
    } catch (error) {
      setError(error.message);
    }
  };

  const removeSection = async (sectionId) => {
    try {
      // First update all groups in this section to have no section
      const { error: groupsError } = await supabase
        .from('groups')
        .update({ section_id: null })
        .eq('section_id', sectionId);

      if (groupsError) throw groupsError;

      // Then delete the section
      const { error: sectionError } = await supabase
        .from('sections')
        .delete()
        .eq('id', sectionId);

      if (sectionError) throw sectionError;

      setSections(sections.filter(section => section.id !== sectionId));

      // Update positions of remaining sections
      const updatedSections = sections
        .filter(section => section.id !== sectionId)
        .map((section, index) => ({
          ...section,
          position: index
        }));

      const updates = updatedSections.map(section => 
        supabase
          .from('sections')
          .update({ position: section.position })
          .eq('id', section.id)
      );

      await Promise.all(updates);
      
      fetchSections();
    } catch (error) {
      console.error('Error removing section:', error);
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
          position: groups.length,
          section_id: null // New groups start unsectioned
        }])
        .select();

      if (error) throw error;

      setGroups([...groups, data[0]]);
      setNewGroupName('');
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
          position: groups.length,
          section_id: group.section_id
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

    const { source, destination, type, draggableId } = result;

    // If dropped in same spot
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      console.log('Dropped in same spot');
      return;
    }

    try {
      if (type === 'SECTION') {
        console.log('Reordering sections...');
        const newSections = Array.from(sections);
        const [removed] = newSections.splice(source.index, 1);
        newSections.splice(destination.index, 0, removed);

        console.log('Setting new sections order:', newSections);
        setSections(newSections);

        console.log('Updating section positions in database...');
        await Promise.all(
          newSections.map((section, index) => 
            supabase
              .from('sections')
              .update({ position: index })
              .eq('id', section.id)
          )
        );
        console.log('Section positions updated');
      } else if (type === 'GROUP') {
        console.log('Reordering groups...');
        
        // Get all groups for proper indexing
        const allGroups = Array.from(groups);
        const movedGroup = allGroups.find(g => g.id.toString() === draggableId);
        
        if (!movedGroup) {
          console.error('Group not found:', draggableId);
          return;
        }

        // Remove the group from its current position
        const filteredGroups = allGroups.filter(g => g.id.toString() !== draggableId);

        // Determine the new section_id
        const sourceSection = source.droppableId.replace('section-', '');
        const destSection = destination.droppableId.replace('section-', '');
        
        // Update section_id
        movedGroup.section_id = destSection === 'unsectioned' ? null : parseInt(destSection);

        // Get groups in the destination section for proper positioning
        const destGroups = destSection === 'unsectioned'
          ? filteredGroups.filter(g => !g.section_id)
          : filteredGroups.filter(g => g.section_id === parseInt(destSection));

        // Insert the group at the new position
        destGroups.splice(destination.index, 0, movedGroup);

        // Update positions for all groups in the destination section
        const updatedGroups = destGroups.map((group, index) => ({
          ...group,
          position: index
        }));

        // Merge with groups from other sections
        const finalGroups = [
          ...filteredGroups.filter(g => {
            if (destSection === 'unsectioned') {
              return g.section_id !== null;
            }
            return g.section_id !== parseInt(destSection);
          }),
          ...updatedGroups
        ];

        console.log('Setting new groups:', finalGroups);
        setGroups(finalGroups);

        // Update the moved group in the database
        await supabase
          .from('groups')
          .update({ 
            section_id: movedGroup.section_id,
            position: destination.index
          })
          .eq('id', movedGroup.id);

        // Update positions for all affected groups
        await Promise.all(
          updatedGroups.map((group, index) => 
            supabase
              .from('groups')
              .update({ position: index })
              .eq('id', group.id)
          )
        );

        console.log('Groups updated in database');
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
      if (type === 'SECTION') {
        fetchSections();
      } else if (type === 'GROUP') {
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
          <form className="add-form" onSubmit={addSection}>
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="New section name"
            />
            <button type="submit">+</button>
          </form>

          <form className="add-form" onSubmit={addGroup}>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group name"
            />
            <button type="submit">+</button>
          </form>

          <Droppable droppableId="sections-list" type="SECTION">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`sections-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
              >
                {sections.map((section, index) => (
                  <Draggable
                    key={section.id}
                    draggableId={`section-${section.id}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`section-item ${snapshot.isDragging ? 'dragging' : ''}`}
                        style={{
                          ...provided.draggableProps.style,
                          backgroundColor: section.color
                        }}
                      >
                        <div 
                          className="section-header" 
                          {...provided.dragHandleProps}
                          onClick={() => toggleSection(section.id)}
                        >
                          <span className="section-name">{section.name}</span>
                          <div className="section-actions">
                            <button onClick={(e) => {
                              e.stopPropagation();
                              const newName = prompt('Enter new name:', section.name);
                              if (newName) editSection(section.id, newName);
                            }}>Edit</button>
                            <button onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this section?')) {
                                removeSection(section.id);
                              }
                            }}>×</button>
                          </div>
                        </div>

                        {section.is_expanded && (
                          <Droppable droppableId={`section-${section.id}`} type="GROUP">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`section-groups ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                              >
                                {groups
                                  .filter(group => group.section_id === section.id)
                                  .map((group, index) => (
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
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <Droppable droppableId="unsectioned" type="GROUP">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`unsectioned-groups ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
              >
                <h3>Unsectioned Groups</h3>
                {groups
                  .filter(group => !group.section_id)
                  .map((group, index) => (
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
