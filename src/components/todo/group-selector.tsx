import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, FolderOpen, ArrowRight } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'src/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'src/components/ui/alert-dialog'
import { useQuery } from 'convex/react'
import { useMutation } from '~/lib/convex-helper'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'

interface GroupSelectorProps {
  selectedGroupId: Id<'todoGroups'> | null
  onGroupSelect: (groupId: Id<'todoGroups'> | null) => void
}

export function GroupSelector({
  selectedGroupId,
  onGroupSelect,
}: GroupSelectorProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [editGroupName, setEditGroupName] = useState('')

  const groups = useQuery(api.todoGroups.list)
  const createGroup = useMutation(api.todoGroups.create)
  const updateGroup = useMutation(api.todoGroups.update)
  const deleteGroup = useMutation(api.todoGroups.remove)

  useEffect(() => {
    if (groups && groups.length > 0) {
      if (!selectedGroupId || !groups.some((g) => g._id === selectedGroupId)) {
        onGroupSelect(groups[0]._id)
      }
    } else if (groups && groups.length === 0) {
      onGroupSelect(null)
    }
  }, [groups, selectedGroupId, onGroupSelect])

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
      setIsEditOpen(false)
      setEditGroupName('')
    } catch (error) {
      console.error('Failed to update group:', error)
    }
  }

  const handleDeleteGroup = async (groupId: Id<'todoGroups'>) => {
    try {
      await deleteGroup
        .mutateAsync({ id: groupId })
        .then(() => onGroupSelect(null))
    } catch (error) {
      console.error('Failed to delete group:', error)
    } finally {
      setIsDeleteAlertOpen(false)
    }
  }

  const openEditPopover = () => {
    const group = groups?.find((g) => g._id === selectedGroupId)
    if (group) {
      setEditGroupName(group.name)
      setIsEditOpen(true)
    }
  }

  if (!groups)
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">
          Loading groups...
        </div>
      </div>
    )

  const selectedGroup = groups?.find((g) => g._id === selectedGroupId)

  return (
    <div className="flex items-center justify-between gap-x-4">
      <div className="flex flex-1 items-center gap-x-2">
        {groups.length > 0 ? (
          <>
            <Select
              value={selectedGroupId ?? ''}
              onValueChange={(value) =>
                onGroupSelect(value as Id<'todoGroups'>)
              }
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select a group">
                  {selectedGroup ? (
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedGroup.name}</span>
                    </div>
                  ) : (
                    'Select a group'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group._id} value={group._id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedGroupId && (
              <>
                <Popover open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={openEditPopover}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    collisionPadding={16}
                    align="start"
                    className="w-80"
                  >
                    <div className="space-y-4">
                      <h4 className="font-medium">Edit group name</h4>
                      <Input
                        placeholder="New group name..."
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter')
                            handleUpdateGroup(selectedGroupId)
                          if (e.key === 'Escape') setIsEditOpen(false)
                        }}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setIsEditOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleUpdateGroup(selectedGroupId)}
                          disabled={
                            !editGroupName.trim() ||
                            updateGroup.status === 'pending'
                          }
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDeleteAlertOpen(true)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <AlertDialog
                  open={isDeleteAlertOpen}
                  onOpenChange={setIsDeleteAlertOpen}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the selected group and all
                        its tasks. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteGroup(selectedGroupId)}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </>
        ) : (
          <p className="  text-muted-foreground flex items-center gap-2">
            Create a group to get started <ArrowRight className="h-4 w-4" />
          </p>
        )}
      </div>

      <Popover open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="border-dashed shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end">
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
                if (e.key === 'Enter') handleCreateGroup()
                if (e.key === 'Escape') setIsCreateOpen(false)
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
