import { deleteOneOnOneChat } from '@/api'
import { requestHandler } from '@/utils'
import React from 'react'

export default function ChatItem() {
  const deleteSingleChat = async () => {
    requestHandler(
      async () => await deleteOneOnOneChat(chatId)
    )
  }
  return (
    <div>
      
    </div>
  )
}
