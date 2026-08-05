// 后端 admin 入口响应类型（字段对齐 common/models 的 toXxxArray 与 DashboardController）。

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
}

export interface PageData<T> {
  list: T[]
  pagination: Pagination
}

/** 管理员信息（对齐 AdminUser::toArray）。 */
export interface AdminUser {
  id: number
  username: string
  realName: string
  roleId: number
  status: number
  lastLoginAt: number | null
}

/** 登录响应（含权限点）。 */
export interface AdminLoginResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
  admin: AdminUser
  permissions: string[]
}

/** 商家（对齐 Shop::toAdminArray）。 */
export interface Shop {
  id: number
  account: string
  name: string
  type: number
  region: string
  contactName: string
  contactPhone: string
  creditScore: number
  deposit: string
  status: number // 0待审核 1正常 2驳回 3封禁
  auditRemark: string
  createdAt: number
}

/** 商品列表项（对齐 Product::toListArray）。 */
export interface ProductListItem {
  id: number
  shopId: number
  title: string
  categoryId: number
  formeDynasty: number
  formeType: string
  style: string
  tradeType: number
  price: string
  cover: string
  stock: number
  isOriginal: number
  sales: number
  rating: string
  status: number // 0下架 1在售 2审核中 3违规下架
}

/** 操作日志（对齐 AdminOperationLog::toArray）。 */
export interface OperationLog {
  id: number
  adminId: number
  action: string
  module: string
  detail: string
  ip: string
  createdAt: number
}

/** 概览指标（对齐 DashboardController::actionIndex）。 */
export interface DashboardData {
  shop: { total: number; pending: number; active: number }
  product: { total: number; auditing: number; onSale: number }
}

export const SHOP_STATUS_TEXT: Record<number, string> = {
  0: '待审核',
  1: '正常',
  2: '已驳回',
  3: '已封禁',
}

export const PRODUCT_STATUS_TEXT: Record<number, string> = {
  0: '已下架',
  1: '在售',
  2: '审核中',
  3: '违规下架',
}

/** 动态巡查项（对齐 Feed::toAdminArray）。 */
export interface FeedListItem {
  id: number
  userId: number
  content: string
  mediaType: number
  media: string[]
  tags: string[]
  city: string
  likeCount: number
  commentCount: number
  favoriteCount: number
  shareCount: number
  status: number // 0待审 1正常 2已下架
  offReason: string
  createdAt: number
  author: { id: number; nickname: string; avatar: string } | null
}

export const FEED_STATUS_TEXT: Record<number, string> = {
  0: '待审核',
  1: '正常',
  2: '已下架',
}

export const SHOP_TYPE_TEXT: Record<number, string> = {
  1: '原创品牌',
  2: '手作匠人',
  3: '租赁',
  4: '妆造',
  5: '摄影',
  6: '文旅',
  7: '非遗',
}

/** 权限点常量。 */
export const PERM = {
  SHOP_AUDIT: 'shop:audit',
  PRODUCT_AUDIT: 'product:audit',
  CONFIG_EDIT: 'config:edit',
  ORDER_MANAGE: 'order:manage',
  REFUND_ARBITRATE: 'refund:arbitrate',
  DEPOSIT_ARBITRATE: 'deposit:arbitrate',
  FEED_AUDIT: 'feed:audit',
  SHOP_PENALTY: 'shop:penalty',
  CONTENT_MANAGE: 'content:manage',
} as const

/** 文旅+文化内容（对齐 Content::toAdminArray）。 */
export interface Content {
  id: number
  type: number // 1文旅 2文化传承
  title: string
  cover: string
  images: string[]
  detail: string
  city: string
  category: string
  likeCount: number
  favoriteCount: number
  signupCount: number
  status: number // 0下架 1上线
  createdAt: number
  updatedAt: number
}

export const CONTENT_TYPE_TEXT: Record<number, string> = {
  1: '文旅',
  2: '文化传承',
}

export const CONTENT_STATUS_TEXT: Record<number, string> = {
  0: '已下线',
  1: '已上线',
}

/** 平台配置项（对齐 ConfigService::decorate）。type：rate=0~1小数 / string=纯文本。 */
export interface SysConfigItem {
  key: string
  value: string | null
  label: string
  desc: string
  type: string
  persisted: boolean
}

/** App 版本（对齐 AppVersion::toAdminArray）。 */
export interface AppVersion {
  id: number
  platform: string
  versionCode: number
  versionName: string
  updateLog: string
  downloadUrl: string
  forceUpdate: boolean
  minSupportedCode: number
  enabled: boolean
  createdAt: number
  updatedAt: number
}

/** 商家信用流水（对齐 ShopPenaltyService::creditLogs）。 */
export interface CreditLog {
  id: number
  change: number
  reason: string
  refType: string
  refId: number | null
  createdAt: number
}

// ---------------- 订单 / 售后（阶段3+ 管理端订单监控 + 仲裁） ----------------

/** 订单明细项（对齐 OrderItem::toArray）。 */
export interface OrderItem {
  id: number
  productId: number
  skuId: number | null
  title: string
  spec: Record<string, string>
  price: string
  qty: number
  image: string
}

/** 收货地址快照。 */
export interface OrderAddress {
  id: number
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
}

/** 订单（对齐 ShopOrder::toListArray/toDetailArray + Service 附加 shopName/items/refund）。 */
export interface Order {
  id: number
  orderNo: string
  shopId: number
  shopName?: string
  type: number
  totalAmount: string
  payAmount: string
  commission?: string
  status: number
  remark: string
  paidAt: number | null
  shippedAt: number | null
  finishedAt: number | null
  createdAt: number
  expressCompany?: string
  expressNo?: string
  address?: OrderAddress | null
  items?: OrderItem[]
  refund?: Refund | null
}

/** 售后单（对齐 OrderRefund::toArray + Service 附加 orderNo/shopId/shopName）。 */
export interface Refund {
  id: number
  orderId: number
  orderNo?: string
  shopId?: number
  shopName?: string
  reason: string
  amount: string
  status: number // 0申请中 1同意 2拒绝 3已完成
  evidence: string[]
  handleRemark: string
  createdAt: number
}

export const ORDER_STATUS_TEXT: Record<number, string> = {
  0: '待付款',
  1: '待发货',
  2: '待收货',
  4: '已完成',
  5: '已取消',
  6: '售后中',
  7: '使用中',
  8: '待归还',
  9: '已归还',
}

/** 品质保障金理赔单（对齐 DepositClaim::toArray + Service 附加 orderNo/shopName/shopDeposit）。 */
export interface DepositClaim {
  id: number
  orderId: number
  orderNo?: string
  shopId: number
  shopName?: string
  shopDeposit?: string
  userId: number
  amount: string
  reason: string
  evidence: string[]
  status: number // 0待判定 1成立赔付 2驳回
  handleRemark: string
  createdAt: number
}

export const DEPOSIT_CLAIM_STATUS_TEXT: Record<number, string> = {
  0: '待判定',
  1: '成立赔付',
  2: '已驳回',
}

export const REFUND_STATUS_TEXT: Record<number, string> = {
  0: '申请中',
  1: '同意',
  2: '已拒绝',
  3: '已完成',
}
