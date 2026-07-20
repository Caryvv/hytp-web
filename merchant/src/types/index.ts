// 后端 merchant 入口响应类型（字段对齐 common/models 的 toXxxArray 驼峰输出）。

/** 统一响应结构 { code, message, data }。 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/** 分页结构。 */
export interface Pagination {
  page: number
  pageSize: number
  total: number
}

export interface PageData<T> {
  list: T[]
  pagination: Pagination
}

/** 商家信息（对齐 Shop::toMerchantArray）。 */
export interface Shop {
  id: number
  account: string
  name: string
  logo: string
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

/** 商家登录响应。 */
export interface MerchantLoginResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
  shop: Shop
}

/** 资质材料（对齐 ShopQualification::toArray）。 */
export interface Qualification {
  id: number
  shopId: number
  qualType: string
  fileUrl: string
  status: number // 0待审 1通过 2驳回
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

/** 商品详情（对齐 Product::toDetailArray）。 */
export interface ProductDetail extends ProductListItem {
  images: string[]
  detail: string
  tryonModelUrl: string | null
  auditRemark: string
  createdAt: number
  updatedAt: number
}

/** 商品新增/编辑入参。 */
export interface ProductForm {
  title: string
  categoryId: number
  formeDynasty: number
  formeType: string
  style: string
  tradeType: number
  price: string
  cover: string
  images: string[]
  detail: string
  stock: number
  isOriginal: number
}

/** 商家状态文案映射。 */
export const SHOP_STATUS_TEXT: Record<number, string> = {
  0: '待审核',
  1: '正常',
  2: '已驳回',
  3: '已封禁',
}

/** 商品状态文案映射。 */
export const PRODUCT_STATUS_TEXT: Record<number, string> = {
  0: '已下架',
  1: '在售',
  2: '审核中',
  3: '违规下架',
}

/** 商家类型。 */
export const SHOP_TYPE_OPTIONS = [
  { value: 1, label: '原创品牌' },
  { value: 2, label: '手作匠人' },
  { value: 3, label: '租赁' },
  { value: 4, label: '妆造' },
  { value: 5, label: '摄影' },
  { value: 6, label: '文旅' },
  { value: 7, label: '非遗' },
]

/** 形制朝代。 */
export const DYNASTY_OPTIONS = [
  { value: 0, label: '其他' },
  { value: 1, label: '秦汉' },
  { value: 2, label: '魏晋' },
  { value: 3, label: '唐' },
  { value: 4, label: '宋' },
  { value: 5, label: '明' },
]

/** 交易类型。 */
export const TRADE_TYPE_OPTIONS = [
  { value: 1, label: '售卖' },
  { value: 2, label: '租赁' },
  { value: 3, label: '定制' },
  { value: 4, label: '服务' },
]

// ---------------- 订单（阶段3+ 商家端订单管理） ----------------

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

/** 订单（对齐 ShopOrder::toListArray / toDetailArray + Service 组装的 items/refund）。 */
export interface Order {
  id: number
  orderNo: string
  shopId: number
  type: number
  totalAmount: string
  payAmount: string
  commission?: string
  status: number // 0待付款 1待发货 2待收货 4已完成 5已取消 6售后
  remark: string
  paidAt: number | null
  shippedAt: number | null
  finishedAt: number | null
  createdAt: number
  userId?: number
  addressId?: number | null
  address?: Address | null
  expressCompany?: string
  expressNo?: string
  items: OrderItem[]
  refund?: Refund | null
}

/** 收货地址快照（对齐 Address::toArray）。 */
export interface Address {
  id: number
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault?: number
}

/** 售后单（对齐 OrderRefund::toArray + Service 附加 orderNo/shopName）。 */
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

/** 订单状态文案（含租赁状态 7/8/9）。 */
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

/** 售后状态文案。 */
export const REFUND_STATUS_TEXT: Record<number, string> = {
  0: '申请中',
  1: '同意',
  2: '已拒绝',
  3: '已完成',
}
