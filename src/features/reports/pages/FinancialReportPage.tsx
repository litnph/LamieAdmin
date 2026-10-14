import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Download, RefreshCw } from '@/shared/icons/lucideAnimated';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/utils/apiError';
import { reportsApi } from '../api/reportsApi';
import type { CashFlowReport, FinancialReport, FinancialReportParams, ManagerialFinanceSummary, ProductRevenueBreakdown } from '../types/financialReport.types';
import { BreakdownDonut } from '../components/BreakdownDonut';
import { DailyRevenueChart, type DailyChartMode } from '../components/DailyRevenueChart';
import { KpiSparkline } from '../components/KpiSparkline';
import { ProfitWaterfall } from '../components/ProfitWaterfall';
import { ReportFilters } from '../components/ReportFilters';
import { RevenueDataDisclosure } from '../components/RevenueDataDisclosure';
import { RevenueHeatmap } from '../components/RevenueHeatmap';
import { SelectedDayPanel } from '../components/SelectedDayPanel';
import { downloadCsv, formatDate, formatMoney, vietnamToday } from '../utils/financeReportFormatters';

type ReportTab = 'revenue' | 'profit' | 'cash' | 'materials' | 'tax';

const tabs: Array<{ id: ReportTab; label: string }> = [
  { id: 'revenue', label: 'Doanh thu theo ngày' },
  { id: 'profit', label: 'Lợi nhuận & chi phí' },
  { id: 'cash', label: 'Dòng tiền' },
  { id: 'materials', label: 'Nguyên liệu' },
  { id: 'tax', label: 'Chứng từ & thuế' },
];

const tabFromQuery = (value: string | null): ReportTab => tabs.some((tab) => tab.id === value) ? value as ReportTab : 'revenue';

const LoadingState = () => <div className="space-y-4" role="status" aria-label="Đang tải báo cáo"><div className="finance-kpi-grid">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-admin-panel bg-admin-muted" />)}</div><div className="h-96 animate-pulse rounded-admin-panel bg-admin-muted" /></div>;

export const FinancialReportPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = useMemo(vietnamToday, []);
  const defaultRange = useMemo(() => ({ from: `${today.slice(0, 8)}01`, to: today }), [today]);
  const initialRange = useMemo(() => ({ from: searchParams.get('from') ?? defaultRange.from, to: searchParams.get('to') ?? defaultRange.to }), [defaultRange]);
  const [tab, setTab] = useState<ReportTab>(() => tabFromQuery(searchParams.get('tab')));
  const [draft, setDraft] = useState(initialRange);
  const [range, setRange] = useState(initialRange);
  const [includeShipping, setIncludeShipping] = useState(searchParams.get('shipping') === '1');
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [cash, setCash] = useState<CashFlowReport | null>(null);
  const [summary, setSummary] = useState<ManagerialFinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(range.to);
  const [chartMode, setChartMode] = useState<DailyChartMode>('line');
  const [ordersOpen, setOrdersOpen] = useState(false);

  const params = useMemo<FinancialReportParams>(() => ({
    ...range,
    groupBy: 'day',
    includeShippingFeeInRevenue: tab === 'revenue' ? includeShipping : true,
  }), [range, tab, includeShipping]);

  const syncUrl = useCallback((nextTab: ReportTab, nextRange = range, shipping = includeShipping) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', nextTab);
    next.set('from', nextRange.from);
    next.set('to', nextRange.to);
    shipping ? next.set('shipping', '1') : next.delete('shipping');
    setSearchParams(next, { replace: true });
  }, [includeShipping, range, searchParams, setSearchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'cash') {
        const [nextCash, nextSummary] = await Promise.all([reportsApi.cashFlow(params), reportsApi.managerial(range)]);
        setCash(nextCash); setSummary(nextSummary);
      } else {
        const [nextReport, nextSummary] = await Promise.all([reportsApi.financial(params), reportsApi.managerial(range)]);
        setReport(nextReport);
        setSummary(nextSummary);
        const dates = nextReport.points.map((point) => point.from);
        setSelectedDate((current) => dates.includes(current) ? current : dates.at(-1) ?? range.from);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      setSummary(null); if (tab === 'cash') setCash(null); else setReport(null);
    } finally {
      setLoading(false);
    }
  }, [params, range.from, tab]);

  useEffect(() => { void load(); }, [load]);

  const changeTab = (next: ReportTab) => {
    setTab(next);
    setOrdersOpen(false);
    syncUrl(next);
  };
  const applyRange = () => {
    if (!draft.from || !draft.to || draft.from > draft.to) {
      setError('Khoảng ngày báo cáo chưa hợp lệ.');
      return;
    }
    setRange(draft);
    setSelectedDate((current) => current < draft.from || current > draft.to ? draft.to : current);
    syncUrl(tab, draft);
  };
  const changeShipping = (checked: boolean) => {
    setIncludeShipping(checked);
    syncUrl(tab, range, checked);
  };
  const exportCurrent = () => {
    if (tab === 'cash' && cash) {
      downloadCsv(`lamie-dong-tien-${range.from}-${range.to}.csv`, [['Thời gian', 'Chiều', 'Loại', 'Tham chiếu', 'Phương thức', 'Số tiền'], ...cash.transactions.map((item) => [item.occurredAt, item.direction === 'in' ? 'Thu' : 'Chi', item.kind, item.reference, item.method, item.amount])]);
      return;
    }
    if (!report) return;
    if (tab === 'revenue') {
      downloadCsv(`lamie-doanh-thu-${range.from}-${range.to}.csv`, [['Ngày giao', 'Số đơn', 'Sản phẩm thuần', 'Phí giao hàng thu khách', 'Tổng doanh thu'], ...report.points.map((point) => [point.from, point.orderCount, point.productRevenue, point.shippingFee, point.productRevenue + point.shippingFee]), ['Tổng', report.orderCount, report.productRevenue, report.shippingFee, report.productRevenue + report.shippingFee]]);
      return;
    }
    void reportsApi.downloadExcel({ ...params, includeShippingFeeInRevenue: true }).catch((requestError) => setError(getApiErrorMessage(requestError)));
  };

  return <div className="finance-page min-w-0">
    <PageHeader eyebrow="Lamie / Finance Studio" title="Nhìn rõ nhịp kinh doanh." description="Doanh thu mỗi ngày. Chi phí đúng chỗ. Dữ liệu thiếu luôn được nói rõ." actions={<button type="button" onClick={exportCurrent} disabled={loading || (tab === 'cash' ? !cash : !report)} className="finance-secondary-button"><Download size={16} />Xuất {tab === 'revenue' || tab === 'cash' ? 'CSV' : 'báo cáo'}</button>} />

    <div className="finance-tabs" role="tablist" aria-label="Báo cáo tài chính">{tabs.map((item, index) => <button key={item.id} role="tab" aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} className={tab === item.id ? 'active' : ''} onClick={() => changeTab(item.id)} onKeyDown={(event) => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; changeTab(tabs[nextIndex].id); requestAnimationFrame(() => document.querySelectorAll<HTMLElement>('.finance-tabs [role="tab"]')[nextIndex]?.focus()); }}>{item.label}</button>)}</div>

    <ReportFilters from={draft.from} to={draft.to} includeShipping={includeShipping} showShippingToggle={tab === 'revenue'} loading={loading} onFromChange={(from) => setDraft((current) => ({ ...current, from }))} onToChange={(to) => setDraft((current) => ({ ...current, to }))} onIncludeShippingChange={changeShipping} onApply={applyRange} />
    {tab !== 'revenue' ? <div className="finance-period-note">Phạm vi báo cáo này: <strong>{formatDate(range.from)} — {formatDate(range.to)}</strong></div> : null}
    {error ? <div className="finance-error" role="alert"><AlertCircle size={18} /><span>{error}</span><button type="button" onClick={() => void load()}><RefreshCw size={15} />Thử lại</button></div> : null}
    {loading ? <LoadingState /> : null}
    {!loading && !error && tab === 'revenue' && report ? <RevenueReport report={report} selectedDate={selectedDate} includeShipping={includeShipping} chartMode={chartMode} ordersOpen={ordersOpen} onChartModeChange={setChartMode} onOrdersOpen={setOrdersOpen} onSelectedDate={setSelectedDate} /> : null}
    {!loading && !error && tab === 'profit' && report ? <ProfitReport report={report} range={range} /> : null}
    {!loading && !error && tab === 'cash' && cash && summary ? <CashFlowView report={cash} summary={summary} /> : null}
    {!loading && !error && tab === 'materials' && summary ? <MaterialsView summary={summary} /> : null}
    {!loading && !error && tab === 'tax' && report && summary ? <TaxView report={report} summary={summary} /> : null}
  </div>;
};

const RevenueReport: React.FC<{ report: FinancialReport; selectedDate: string; includeShipping: boolean; chartMode: DailyChartMode; ordersOpen: boolean; onChartModeChange: (mode: DailyChartMode) => void; onOrdersOpen: (open: boolean) => void; onSelectedDate: (date: string) => void }> = ({ report, selectedDate, includeShipping, chartMode, ordersOpen, onChartModeChange, onOrdersOpen, onSelectedDate }) => {
  const total = report.revenue;
  const peak = report.points.reduce<typeof report.points[number] | null>((best, point) => !best || point.revenue > best.revenue ? point : best, null);
  const hasRevenue = total > 0;
  return <>
    <div className="finance-kpi-grid"><KpiSparkline label={includeShipping ? 'Tổng doanh thu' : 'Doanh thu sản phẩm'} value={total} detail={`${report.period.days} ngày trong khoảng chọn`} values={report.points.map((point) => point.revenue)} money accent /><KpiSparkline label="Đơn đã giao" value={`${report.orderCount} đơn`} detail="Ghi nhận theo ngày giao hoàn tất" values={report.points.map((point) => point.orderCount)} bars /><KpiSparkline label="Trung bình mỗi ngày" value={report.period.days ? total / report.period.days : 0} detail="Gồm cả ngày không có đơn" values={report.points.map((point) => point.revenue)} money /><KpiSparkline label="Ngày cao nhất" value={hasRevenue && peak ? peak.revenue : 'Chưa có doanh thu'} detail={hasRevenue && peak ? `${formatDate(peak.from)} · ${peak.orderCount} đơn` : 'Không chọn một ngày 0 ₫ làm ngày tốt nhất'} values={report.points.map((point) => point.revenue)} money={hasRevenue} bars /></div>
    <div className="finance-revenue-stage"><DailyRevenueChart points={report.points} selectedDate={selectedDate} mode={chartMode} onModeChange={onChartModeChange} onSelect={onSelectedDate} /><SelectedDayPanel points={report.points} orders={report.dailyOrders ?? []} adjustments={report.dailyRevenueAdjustments ?? []} selectedDate={selectedDate} includeShipping={includeShipping} dialogOpen={ordersOpen} onDialogOpen={onOrdersOpen} onSelect={onSelectedDate} /></div>
    <div className="finance-bottom-grid"><RevenueHeatmap points={report.points} selectedDate={selectedDate} onSelect={onSelectedDate} /><BreakdownDonut rows={report.revenueByCategory ?? []} /></div>
    <RevenueDataDisclosure report={report} />
    <p className="finance-footnote">Doanh thu thuần theo ngày giao hoàn tất tại Asia/Ho_Chi_Minh. Lợi nhuận chỉ được xác định theo kỳ kiểm kê, không phân bổ tùy ý cho từng ngày.</p>
  </>;
};

const ProfitReport: React.FC<{ report: FinancialReport; range: { from: string; to: string } }> = ({ report, range }) => {
  const knownCosts = report.shippingFeeActual + report.otherExpense + report.materialProductCogs + report.materialWaste;
  const costRows: ProductRevenueBreakdown[] = [{ id: null, name: 'Nguyên liệu trong sản phẩm', revenue: report.materialProductCogs }, { id: null, name: 'Hao hụt', revenue: report.materialWaste }, { id: null, name: 'Giao hàng thực tế', revenue: report.shippingFeeActual }, ...report.expensesByCategory.map((row) => ({ id: null, name: row.expenseCategoryName, revenue: row.totalAmount }))].filter((row) => row.revenue > 0);
  return <>
    {report.unreconciledShippingCount ? <div className="finance-data-warning"><strong>{report.unreconciledShippingCount} đơn chưa có phí ship thực tế.</strong><span>Phí thực tế đang là dữ liệu thiếu, không được coi là 0; chưa thể đối soát hoặc chốt kỳ.</span></div> : null}
    <div className="finance-status-strip"><div><strong>● {report.isProfitProvisional ? 'Lợi nhuận tạm tính' : 'Kỳ đã đủ dữ liệu lợi nhuận'}</strong><p>Phạm vi {formatDate(range.from)} — {formatDate(range.to)}{report.profitProvisionalReasons.length ? ` · ${report.profitProvisionalReasons.join(' ')}` : ' đã dùng kiểm kê được xác nhận.'}</p></div><Link to="/admin/finance/period-close" className="finance-text-link">Kiểm kê & chốt kỳ →</Link></div>
    <div className="finance-kpi-grid"><KpiSparkline label="Tổng doanh thu" value={report.productRevenue + report.shippingFee} detail={`${formatMoney(report.productRevenue)} sản phẩm + ${formatMoney(report.shippingFee)} ship`} values={report.points.map((point) => point.productRevenue + point.shippingFee)} money accent /><KpiSparkline label="Tổng chi phí" value={knownCosts} detail="Giá vốn, hao hụt, carrier và vận hành" values={report.points.map((point) => point.shippingFeeActual + point.otherExpense)} money /><KpiSparkline label="Lợi nhuận trước thuế" value={report.profit} detail={report.isProfitProvisional ? 'Tạm tính do dữ liệu kỳ chưa đủ xác nhận' : 'Theo kiểm kê và chi phí kỳ'} values={[]} money /><KpiSparkline label="Biên lợi nhuận" value={report.profitMarginPercent === null ? '—' : `${report.profitMarginPercent}%`} detail="Lợi nhuận / tổng doanh thu" values={[]} /></div>
    <ProfitWaterfall report={report} />
    <div className="finance-bottom-grid"><BreakdownDonut rows={costRows} title="Chi phí nằm ở đâu?" description="Theo kiểm kê và giao dịch gốc trong phạm vi" /><section className="finance-card"><div className="finance-card-head"><div><h2>Phí giao hàng: đang bù bao nhiêu?</h2><p>Phí tính khách so với chi phí carrier thực tế.</p></div></div><div className="finance-card-body"><strong className={report.shippingFee - report.shippingFeeActual < 0 ? 'finance-large-negative' : 'finance-large-positive'}>{formatMoney(report.shippingFee - report.shippingFeeActual)}</strong><div className="finance-paired-bar"><span><b>Thu khách</b><em>{formatMoney(report.shippingFee)}</em></span><i style={{ width: `${Math.min(100, report.shippingFee / Math.max(1, report.shippingFee, report.shippingFeeActual) * 100)}%` }} /></div><div className="finance-paired-bar alt"><span><b>Chi thực tế</b><em>{formatMoney(report.shippingFeeActual)}</em></span><i style={{ width: `${Math.min(100, report.shippingFeeActual / Math.max(1, report.shippingFee, report.shippingFeeActual) * 100)}%` }} /></div></div></section></div>
    <details className="finance-card finance-disclosure"><summary><span><b>Bảng tính chi tiết lợi nhuận kỳ</b><small>{report.isProfitProvisional ? 'Tạm tính — xem nguyên nhân phía trên' : 'Đã đủ các xác nhận dữ liệu'}</small></span><span>Mở bảng +</span></summary><div className="finance-card-body"><dl className="finance-statement"><div><dt>Doanh thu sản phẩm thuần</dt><dd>{formatMoney(report.productRevenue)}</dd></div><div><dt>Phí giao hàng tính khách</dt><dd>{formatMoney(report.shippingFee)}</dd></div><div><dt>Giá vốn nguyên liệu sản phẩm</dt><dd>−{formatMoney(report.materialProductCogs)}</dd></div><div><dt>Hao hụt</dt><dd>−{formatMoney(report.materialWaste)}</dd></div><div><dt>Chi phí carrier thực tế</dt><dd>−{formatMoney(report.shippingFeeActual)}</dd></div><div><dt>Chi phí vận hành</dt><dd>−{formatMoney(report.otherExpense)}</dd></div><div><dt>Lợi nhuận trước thuế</dt><dd>{formatMoney(report.profit)}</dd></div></dl></div></details>
  </>;
};

const CashFlowView: React.FC<{ report: CashFlowReport; summary: ManagerialFinanceSummary }> = ({ report, summary }) => {
  const max = Math.max(1, ...report.points.flatMap((point) => [point.cashIn, point.cashOut]));
  return <>
    {report.incompleteHistoryCount ? <div className="finance-data-warning"><strong>Có {report.incompleteHistoryCount} giao dịch cũ thiếu lịch sử thanh toán.</strong><span>Các khoản này không bị tự động coi là đã thu hoặc đã chi.</span></div> : null}
    <div className="finance-kpi-grid"><KpiSparkline label="Số dư đầu kỳ" value={summary.openingCashBalance ?? 'Chưa nhập'} detail="Số dư quỹ/tài khoản khai báo cho kỳ" values={[]} money={summary.openingCashBalance !== null} /><KpiSparkline label="Thực thu" value={report.cashIn} detail="Theo từng giao dịch nhận tiền" values={report.points.map((point) => point.cashIn)} money accent /><KpiSparkline label="Thực chi" value={report.cashOut} detail="Gồm nhà cung cấp, vận hành và carrier" values={report.points.map((point) => point.cashOut)} money /><KpiSparkline label="Số dư cuối kỳ" value={summary.closingCashBalance ?? 'Chưa xác định'} detail={summary.closingCashBalance === null ? 'Cần nhập số dư đầu kỳ' : 'Đầu kỳ + thu − chi'} values={report.points.map((point) => Math.abs(point.netCash))} money={summary.closingCashBalance !== null} /></div>
    <section className="finance-card"><div className="finance-card-head"><div><h2>Tiền vào và tiền ra</h2><p>Theo ngày giao dịch tiền, độc lập với ngày giao đơn.</p></div></div><div className="finance-cash-chart">{report.points.map((point) => <div key={point.date}><span className="finance-cash-bars"><i style={{ height: `${point.cashIn / max * 100}%` }} title={`Thu ${formatMoney(point.cashIn)}`} /><i style={{ height: `${point.cashOut / max * 100}%` }} title={`Chi ${formatMoney(point.cashOut)}`} /></span><small>{formatDate(point.date, false)}</small></div>)}</div><div className="finance-chart-legend"><span><i />Thực thu</span><span><i />Thực chi</span><span>Đơn vị: đồng</span></div></section>
    <section className="finance-card"><div className="finance-card-head"><div><h2>Giao dịch trong kỳ</h2><p>Tiền cọc, phần còn lại và hoàn tiền là các giao dịch độc lập.</p></div></div><div className="finance-table-scroll"><table className="finance-table"><thead><tr><th>Thời gian</th><th>Loại</th><th>Tham chiếu</th><th>Phương thức</th><th className="num">Tiền vào</th><th className="num">Tiền ra</th></tr></thead><tbody>{report.transactions.map((item) => <tr key={item.id}><td>{new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.occurredAt))}</td><td>{item.kind}</td><td>{item.reference}</td><td>{item.method}</td><td className="num">{item.direction === 'in' ? formatMoney(item.amount) : '—'}</td><td className="num">{item.direction === 'out' ? formatMoney(item.amount) : '—'}</td></tr>)}</tbody></table>{!report.transactions.length ? <div className="finance-empty">Chưa có giao dịch tiền trong khoảng này.</div> : null}</div></section>
    <div className="finance-kpi-grid"><KpiSparkline label="Nợ nhà cung cấp" value={summary.supplierDebt} detail="Phiếu mua trừ các lần đã trả" values={[]} money /><KpiSparkline label="Nợ chi phí vận hành" value={summary.operatingExpenseDebt} detail="Chi phí phát sinh trừ các lần đã trả" values={[]} money /></div>
  </>;
};

const groupNames: Record<number, string> = { 1: 'Hoa tươi', 2: 'Phụ liệu', 3: 'Giỏ, bình & phụ kiện', 99: 'Khác' };
const MaterialsView: React.FC<{ summary: ManagerialFinanceSummary }> = ({ summary }) => <>
  {summary.provisionalReasons.length ? <div className="finance-data-warning"><strong>Dữ liệu nguyên liệu đang tạm tính.</strong><span>{summary.provisionalReasons.join(' ')}</span></div> : null}
  <div className="finance-kpi-grid"><KpiSparkline label="Tồn đầu" value={summary.materials.reduce((sum, row) => sum + row.openingValue, 0)} detail="Kế thừa kỳ đã chốt trước" values={[]} money /><KpiSparkline label="Mua trong kỳ" value={summary.materials.reduce((sum, row) => sum + row.purchasesValue, 0)} detail="Theo ngày nhận hàng" values={[]} money accent /><KpiSparkline label="Tồn cuối" value={summary.materials.reduce((sum, row) => sum + row.endingValue, 0)} detail="Theo giá vốn kiểm kê" values={[]} money /><KpiSparkline label="Giá vốn + hao hụt" value={summary.materialProductCogs + summary.materialWaste} detail="Không trừ tiền mua thêm lần hai" values={[]} money /></div>
  <section className="finance-card"><div className="finance-card-head"><div><h2>Phân bổ nguyên liệu theo nhóm</h2><p>Tồn đầu + mua + điều chỉnh − tồn cuối = tiêu hao; giá vốn = tiêu hao − hao hụt.</p></div><Link to="/admin/finance/period-close" className="finance-primary-button">Kiểm kê & chốt kỳ</Link></div><div className="finance-table-scroll"><table className="finance-table"><thead><tr><th>Nhóm</th><th className="num">Tồn đầu</th><th className="num">Mua</th><th className="num">Tồn cuối</th><th className="num">Hao hụt</th><th className="num">Trong sản phẩm</th><th>Trạng thái</th></tr></thead><tbody>{summary.materials.map((row) => <tr key={row.group}><td>{groupNames[row.group] ?? 'Khác'}</td><td className="num">{formatMoney(row.openingValue)}</td><td className="num">{formatMoney(row.purchasesValue)}</td><td className="num">{formatMoney(row.endingValue)}</td><td className="num">{formatMoney(row.wasteValue)}</td><td className="num">{formatMoney(row.productCogsValue)}</td><td>{row.isEstimated ? 'Ước tính' : 'Đã nhập thực tế'}</td></tr>)}</tbody></table>{!summary.materials.length ? <div className="finance-empty">Chưa có phiếu mua hoặc kiểm kê trong kỳ.</div> : null}</div></section>
</>;

const TaxView: React.FC<{ report: FinancialReport; summary: ManagerialFinanceSummary }> = ({ report, summary }) => {
  const documentCount = summary.documents.reduce((sum, row) => sum + row.count, 0);
  const needsMore = summary.documents.filter((row) => row.status === 1 || row.status === 2).reduce((sum, row) => sum + row.count, 0);
  return <><div className="finance-kpi-grid"><KpiSparkline label="Doanh thu cần đối soát" value={report.productRevenue + report.shippingFee} detail="Sản phẩm + phí giao hàng thu khách" values={report.points.map((point) => point.productRevenue + point.shippingFee)} money accent /><KpiSparkline label="Hồ sơ mua" value={`${documentCount} hồ sơ`} detail="Theo phiếu mua nguyên liệu" values={[]} /><KpiSparkline label="Chứng từ cần bổ sung" value={`${needsMore} hồ sơ`} detail="Thiếu hoặc đang cần kiểm tra" values={[]} /><KpiSparkline label="Đủ điều kiện thuế" value={summary.taxConfigured ? 'Theo cấu hình' : 'Chưa đánh giá'} detail="Tách biệt với trạng thái chứng từ" values={[]} /></div><section className="finance-card"><div className="finance-card-head"><div><h2>Đối soát hồ sơ mua hàng</h2><p>{summary.taxMessage}</p></div><Link to="/admin/finance/purchases" className="finance-secondary-button">Mở phiếu mua</Link></div><div className="finance-table-scroll"><table className="finance-table"><thead><tr><th>Trạng thái chứng từ</th><th className="num">Số hồ sơ</th><th className="num">Giá trị mua</th></tr></thead><tbody>{summary.documents.map((row) => <tr key={row.status}><td>{({ 1: 'Thiếu', 2: 'Cần kiểm tra', 3: 'Có tài liệu chờ kiểm tra', 4: 'Đã đối soát' } as Record<number, string>)[row.status]}</td><td className="num">{row.count}</td><td className="num">{formatMoney(row.amount)}</td></tr>)}</tbody></table>{!summary.documents.length ? <div className="finance-empty">Chưa có hồ sơ mua trong phạm vi.</div> : null}</div></section></>;
};
