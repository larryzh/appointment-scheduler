import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './SymbolListManager.css';

const GroupSelector = () => {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('list_groups')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching groups:', error);
    } else {
      setGroups(data || []);
    }
  };

  const addGroup = async () => {
    if (newGroupName.trim() === '') return;

    const { data, error } = await supabase
      .from('list_groups')
      .insert({
        name: newGroupName
      })
      .select();

    if (error) {
      console.error('Error adding group:', error);
    } else {
      setGroups([...groups, data[0]]);
      setNewGroupName('');
    }
  };

  const updateGroup = async (groupId, newName) => {
    if (newName.trim() === '') return;

    const { error } = await supabase
      .from('list_groups')
      .update({ name: newName })
      .eq('id', groupId);

    if (error) {
      console.error('Error updating group:', error);
    } else {
      const updatedGroups = groups.map(group =>
        group.id === groupId ? { ...group, name: newName } : group
      );
      setGroups(updatedGroups);
    }
    setEditingGroupId(null);
  };

  const deleteGroup = async (groupId) => {
    const { error } = await supabase
      .from('list_groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      console.error('Error deleting group:', error);
    } else {
      setGroups(groups.filter(group => group.id !== groupId));
    }
  };

  const handleGroupClick = (groupId) => {
    navigate(`/lists/${groupId}`);
  };

  return (
    <div className="group-selector">
      <h2>List Groups</h2>
      <div className="add-group-form">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="New group name"
        />
        <button onClick={addGroup}>Add Group</button>
      </div>
      <div className="groups-list">
        {groups.map(group => (
          <div key={group.id} className="group-item">
            {editingGroupId === group.id ? (
              <input
                type="text"
                value={group.name}
                onChange={(e) => {
                  const updatedGroups = groups.map(g =>
                    g.id === group.id ? { ...g, name: e.target.value } : g
                  );
                  setGroups(updatedGroups);
                }}
                onBlur={() => updateGroup(group.id, group.name)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    updateGroup(group.id, group.name);
                  }
                }}
                autoFocus
              />
            ) : (
              <div className="group-content">
                <span className="group-name" onClick={() => handleGroupClick(group.id)}>
                  {group.name}
                </span>
                <div className="group-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingGroupId(group.id);
                    }}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteGroup(group.id);
                    }}
                    className="delete-button"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupSelector;
