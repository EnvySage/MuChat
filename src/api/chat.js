//聊天相关的API
import http from "@/utils/http";
export default {
    getAllChatRooms: () => http.get('/chatRoom/getAllRoom'),
    createChatRoom: (room) => http.post('/chatRoom/createRoom',room),
    getCurrentMessageList: (roomId,size,beforeTime) => http.get('/msg/list/' + roomId,{size,beforeTime}),
    getAllContact: () => http.get('/contacts/all'),
    addContact: (contact) => http.post('/contacts/add',contact),
    deleteContact: (contactId) => http.delete('/contacts/delete/' + contactId),
    getOssToken: (folder) => http.get('/oss/getOssToken', { folder }),
    updateAvatar: (avatarUrl) => http.post('/oss/updateAvatar', { avatarUrl }),
    reportRead: (chatRoom) => http.put('/chatRoom/read', chatRoom),
}