import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { requestHandler } from "@/utils";
import { 
  updateGroupName, 
  deleteGroupChat, 
  getAvailableUsers, 
  getGroupChatDetails, 
  addNewParticipantInGroupChat, 
  removeParticipantFromGroupChat, 
} from "@/api";

export default function GroupChatDetailsModal({chatId}) {
	const { user } = useAuth();
	const [users, setUsers] = useState([]);
	const [participantToBeAdded, setParticipantToBeAdded] = useState("");
	const [newGroupName, setNewGroupName] = useState("");
	const [groupDetails, setGroupDetails] = useState(null);
	const [addingParticipant, setAddingParticipant] = useState(false);
	const [renamingGroup, setRenamingGroup] = useState(false);

  const getUsers = async () => {
    requestHandler(
      async () => getAvailableUsers(),
      null,
      (res) => {
        const {data} = res
        setUsers(data || [])
      },
      alert
    )
  }

  const handleUpdateGroupName = async () => {
    requestHandler(
      async () => await updateGroupName(chatId, newGroupName),
      setRenamingGroup,
      (res) => {
        const {data} = res;
        setGroupDetails(data)
        setNewGroupName(data.name)
        alert(res.message)
      },
      alert
    )
  }

  const fetchGroupDetails = async () => {
    requestHandler(
      async () => await getGroupChatDetails(chatId),
      null,
      (res) => {
        const {data} = res
        setGroupDetails(data)
        setNewGroupName(data.name || "")
        alert(res.message)
      },
      alert
    )
  }

  const handleGroupDelete = async () => {
    if (groupDetails?.admin !== user._id) {
      return alert("You are not admin")
    }
    requestHandler(
      async () => await deleteGroupChat(chatId),
      null,
      (res) => {
        alert(res.message)
      },
      alert
    )
  }

  const addParticipant = async () => {
    if (groupDetails?.admin !== user._id) {
      return alert("You are not admin")
    }
    if (!participantToBeAdded) {
      return alert("Select a particiant to add")
    }
    requestHandler(
      async () => await addNewParticipantInGroupChat(chatId, participantToBeAdded),
      setAddingParticipant,
      (res) => {
        const {data} = res;
        const updatedGroupDetails = {
          ...groupDetails,
          participants: data?.participants || []
        }
        setGroupDetails(updatedGroupDetails)
        alert(res.message)
      },
      alert
    )
  }

  const removeParticipant = async (participantId) => {
    if (groupDetails?.admin !== user._id) {
      return alert("You are not admin")
    }
    if (!participantId) {
      return alert("No participant to delete")
    }
    requestHandler(
      async () => await removeParticipantFromGroupChat(chatId, participantId),
      null,
      (res) => {
        const updatedGroupDetails = {
          ...groupDetails,
          participants: groupDetails.participants.filter(p => p._id !== participantId) || []
        }
        setGroupDetails(updatedGroupDetails)
        alert(res?.message)
      },
      alert
    )
  }

	return <div></div>;
}
