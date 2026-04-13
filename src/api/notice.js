import http from "@/utils/http";
export default {
    // ===== 通知相关 =====
    /** 通知列表（支持按类型、状态筛选+分页） */
    getNoticeList: (params) => http.get('/notice/list', params),
    /** 通知详情（获取并自动标记已读） */
    getNoticeDetail: (id) => http.get('/notice/detail/' + id),
    /** 处理通知（同意/拒绝） */
    handleNotice: (data) => http.post('/notice/handle', data),
    /** 单条标记已读 */
    readNotice: (id) => http.put('/notice/read/' + id),
    /** 全部已读（可选type参数按类型全读） */
    readAllNotice: (params) => http.put('/notice/readAll', params),
    /** 未读数量 */
    getUnreadCount: () => http.get('/notice/unreadCount'),
}
