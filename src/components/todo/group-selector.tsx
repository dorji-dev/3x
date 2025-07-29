import { useEffect, useState } from 'react'
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  FolderOpen,
  ArrowRight,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from 'src/components/ui/tabs'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Badge } from 'src/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'src/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu'
import { useQuery } from 'convex/react'
import { useMutation } from '~/lib/convex-helper'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'

interface GroupSelectorProps {
  selectedGroupId: Id<'todoGroups'> | null
  onGroupSelect: (groupId: Id<'todoGroups'> | null) => void
}

export function GroupSelector({
  selectedGroupId,
  onGroupSelect,
}: GroupSelectorProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<Id<'todoGroups'> | null>(
    null,
  )
  const [newGroupName, setNewGroupName] = useState('')
  const [editGroupName, setEditGroupName] = useState('')

  const groups = useQuery(api.todoGroups.list)
  const createGroup = useMutation(api.todoGroups.create)
  const updateGroup = useMutation(api.todoGroups.update)
  const deleteGroup = useMutation(api.todoGroups.remove)

  useEffect(() => {
    if (groups && groups.length > 0) {
      if (!selectedGroupId) {
        onGroupSelect(groups[0]._id)
      }
    }
  }, [groups, onGroupSelect])

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return

    try {
      const groupId = await createGroup.mutateAsync({
        name: newGroupName.trim(),
      })
      onGroupSelect(groupId)
      setNewGroupName('')
      setIsCreateOpen(false)
    } catch (error) {
      console.error('Failed to create group:', error)
    }
  }

  const handleUpdateGroup = async (groupId: Id<'todoGroups'>) => {
    if (!editGroupName.trim()) return

    try {
      await updateGroup.mutateAsync({ id: groupId, name: editGroupName.trim() })
      setEditingGroupId(null)
      setEditGroupName('')
    } catch (error) {
      console.error('Failed to update group:', error)
    }
  }

  const handleDeleteGroup = async (groupId: Id<'todoGroups'>) => {
    try {
      await deleteGroup.mutateAsync({ id: groupId })
      if (selectedGroupId === groupId) {
        const remainingGroups = groups?.filter((g) => g._id !== groupId) ?? []
        if (remainingGroups.length > 0) {
          onGroupSelect(remainingGroups[0]._id)
        } else {
          onGroupSelect(null)
        }
      }
    } catch (error) {
      console.error('Failed to delete group:', error)
    }
  }

  const startEdit = (group: any) => {
    setEditingGroupId(group._id)
    setEditGroupName(group.name)
  }

  if (!groups)
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">
          Loading groups...
        </div>
      </div>
    )

  return (
    <div className="flex items-center justify-between gap-x-4">
      {groups.length ? (
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="flex-1">
            <Tabs
              value={selectedGroupId || ''}
              onValueChange={(value) =>
                onGroupSelect(value as Id<'todoGroups'>)
              }
            >
              <TabsList>
                {groups.map((group) => (
                  <div key={group._id} className="flex items-center group">
                    <TabsTrigger
                      value={group._id}
                      className="cursor-pointer border border-background"
                    >
                      {editingGroupId === group._id ? (
                        <Input
                          value={editGroupName}
                          onChange={(e) => setEditGroupName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateGroup(group._id)
                            } else if (e.key === 'Escape') {
                              setEditingGroupId(null)
                              setEditGroupName('')
                            }
                          }}
                          onBlur={() => handleUpdateGroup(group._id)}
                          className="h-6 w-auto min-w-[80px] text-xs"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          <span
                            className={
                              group._id === selectedGroupId
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            }
                          >
                            {group.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="ml-2 text-xs opacity-70"
                          >
                            {/* Todo count can be added later */}
                          </Badge>
                        </div>
                      )}
                    </TabsTrigger>

                    {editingGroupId !== group._id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => startEdit(group)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteGroup(group._id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </TabsList>
            </Tabs>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      ) : (
        <p className="text-muted-foreground flex items-center gap-2">
          Create a group to get started <ArrowRight className="h-4 w-4" />
        </p>
      )}

      <Popover open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="border-dashed">
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[calc(100vw-2rem)] max-w-sm mx-4 sm:w-80 sm:mx-0"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-medium">Create new group</h4>
            </div>
            <Input
              placeholder="Group name..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateGroup()
                } else if (e.key === 'Escape') {
                  setIsCreateOpen(false)
                  setNewGroupName('')
                }
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreateOpen(false)
                  setNewGroupName('')
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={
                  !newGroupName.trim() || createGroup.status === 'pending'
                }
                onClick={handleCreateGroup}
                size="sm"
              >
                Create
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
