//聊天相关的API
import http from "@/utils/http";
export default {
    getAllChatRooms: () => http.get('/chatRoom/getAllRoom'),
    createChatRoom: (room) => http.post('/chatRoom/createRoom',room),
    getCurrentMessageList: (roomId,size,beforeTime) => http.get('/msg/list/' + roomId,{size,beforeTime}),
    getAllContact: () => http.get('/contacts/all'),
    addContact: (contact) => http.post('/contacts/add',contact),
    updateContact: (contact)=> http.put('/contacts/update',contact),
    deleteContact: (contactId) => http.delete('/contacts/delete/' + contactId),
    getOssToken: (params) => http.get('/oss/getOssToken', params),
    updateAvatar: (avatarUrl) => http.post('/oss/updateAvatar', { avatarUrl }),
    reportRead: (chatRoom) => http.put('/chatRoom/read', chatRoom),
    updateGroupNickname: (data) => http.put('/chatRoom/updateGroupNickname', data),
    inviteMember: (data) => http.post('/chatRoom/inviteGroup', data),
    updateGroupInfo: (data) => http.put('/chatRoom/updateGroupInfo', data),
    batchMute: (data) => http.put('/chatRoom/batchMute', data),
    kickMember: (data) => http.post('/chatRoom/kickGroup', data),
    exitGroup: (chatRoomId) => http.delete('/chatRoom/exitRoom/' + chatRoomId)
}