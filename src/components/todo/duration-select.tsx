import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'

interface DurationSelectProps {
  value?: number
  onValueChange: (minutes?: number) => void
  placeholder?: string
}

export function DurationSelect({
  value,
  onValueChange,
  placeholder = 'Set duration',
}: DurationSelectProps) {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours}h`
    }
    return `${hours}h ${remainingMinutes}m`
  }

  const getDurationOptions = () => {
    const options = [
      // Quick minutes
      { value: 5, label: '5m' },
      { value: 10, label: '10m' },
      { value: 15, label: '15m' },
      { value: 30, label: '30m' },
      { value: 45, label: '45m' },

      // Hours
      { value: 60, label: '1h' },
      { value: 90, label: '1h 30m' },
      { value: 120, label: '2h' },
      { value: 180, label: '3h' },
      { value: 240, label: '4h' },
      { value: 300, label: '5h' },
      { value: 360, label: '6h' },
      { value: 480, label: '8h' },
    ]
    return options
  }

  return (
    <Select
      value={value ? value.toString() : undefined}
      onValueChange={(val) => {
        if (val === 'none') {
          onValueChange(undefined)
        } else {
          onValueChange(parseInt(val))
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {value ? formatDuration(value) : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No duration</SelectItem>
        {getDurationOptions().map((option) => (
          <SelectItem key={option.value} value={option.value.toString()}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
