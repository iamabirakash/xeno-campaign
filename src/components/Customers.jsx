import { currency } from "../utils/api";
import { SectionTitle } from "./shared";

export default function Customers({ customers }) {
  return (
    <section id="customers" className="mt-5 rounded-lg border border-line bg-white p-5 shadow-panel">
      <SectionTitle eyebrow="Ingested shoppers" title="Customers" />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Lifecycle</th>
              <th className="px-3 py-3">Spend</th>
              <th className="px-3 py-3">Orders</th>
              <th className="px-3 py-3">Last order</th>
              <th className="px-3 py-3">Channel</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr className="border-b border-line last:border-0" key={customer.id}>
                <td className="whitespace-nowrap px-3 py-3">
                  <strong>{customer.name}</strong>
                  <span className="block text-sm text-muted">
                    {customer.city} · {customer.favoriteCategory}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3">{customer.lifecycle}</td>
                <td className="whitespace-nowrap px-3 py-3">{currency.format(customer.totalSpend)}</td>
                <td className="whitespace-nowrap px-3 py-3">{customer.orderCount}</td>
                <td className="whitespace-nowrap px-3 py-3">{customer.daysSinceLastOrder} days ago</td>
                <td className="whitespace-nowrap px-3 py-3">{customer.preferredChannel.toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
