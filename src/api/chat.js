//聊天相关的API
import http from "@/utils/http";
export default {
    getAllChatRooms: () => http.get('/chatRoom/getAllRoom'),
    getCurrentMessageList: (roomId) => http.get('/msg/list/' + roomId),
}