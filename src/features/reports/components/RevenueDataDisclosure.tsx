import React from 'react';
import type { FinancialReport } from '../types/financialReport.types';
import { formatDate, formatMoney } from '../utils/financeReportFormatters';

export const RevenueDataDisclosure: React.FC<{ report: FinancialReport }> = ({ report }) => (
  <details className="finance-card finance-disclosure">
    <summary><span><b>Số liệu doanh thu từng ngày</b><small>Dùng khi cần đối soát hoặc xem số tiền chính xác</small></span><span>Mở bảng +</span></summary>
    <div className="finance-table-scroll"><table className="finance-table"><thead><tr><th>Ngày giao</th><th className="num">Số đơn</th><th className="num">Sản phẩm thuần</th><th className="num">Ship thu khách</th><th className="num">Tổng doanh thu</th></tr></thead><tbody>{report.points.map((point) => <tr key={point.from}><td>{formatDate(point.from)}</td><td className="num">{point.orderCount}</td><td className="num">{formatMoney(point.productRevenue)}</td><td className="num">{formatMoney(point.shippingFee)}</td><td className="num"><strong>{formatMoney(point.productRevenue + point.shippingFee)}</strong></td></tr>)}</tbody><tfoot><tr><th>Tổng kỳ</th><td className="num">{report.orderCount}</td><td className="num">{formatMoney(report.productRevenue)}</td><td className="num">{formatMoney(report.shippingFee)}</td><td className="num">{formatMoney(report.productRevenue + report.shippingFee)}</td></tr></tfoot></table></div>
  </details>
);
