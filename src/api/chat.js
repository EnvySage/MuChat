//聊天相关的API
import http from "@/utils/http";
export default {
    getAllChatRooms: () => http.get('/chatRoom/getAllRoom'),
    createChatRoom: (room) => http.post('/chatRoom/createRoom',room),
    getCurrentMessageList: (roomId,size,beforeTime) => http.get('/msg/list/' + roomId,{size,beforeTime}),
    getAllContact: () => http.get('/contacts/all'),
    addContact: (contact) => http.post('/contacts/add',contact),
    deleteContact: (contactId) => http.delete('/contacts/delete/' + contactId),
    // OSS 相关
    getOssToken: (folder) => http.get('/oss/getOssToken', { folder }),
    updateAvatar: (avatarUrl) => http.post('/oss/updateAvatar', { avatarUrl }),
    // 已读相关
    // 参数: chatRoomId, userId, lastReadMessageId (role不传,后端自己查)
    reportRead: (chatRoomId, userId, lastReadMessageId) => http.put('/chatRoom/read', { chatRoomId, userId, lastReadMessageId }),
}