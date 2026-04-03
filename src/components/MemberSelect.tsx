import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { listMembersLite } from '@/lib/modules-api'
import type { Member } from '@/lib/types'

type Props = {
  value: string
  onValueChange: (memberId: string) => void
  disabled?: boolean
  placeholder?: string
}

export function MemberSelect({
  value,
  onValueChange,
  disabled,
  placeholder = 'Select member',
}: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await listMembersLite()
        if (!cancelled) setMembers(rows)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <Skeleton className="h-9 w-full" />
  }

  const labelForId = (id: string) => {
    if (!id) return ''
    const m = members.find((x) => x.id === id)
    if (m) return `${m.full_name} (${m.client_id})`
    return placeholder
  }

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v != null) onValueChange(v)
      }}
      disabled={disabled}
      itemToStringLabel={labelForId}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {members.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.full_name} ({m.client_id})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
