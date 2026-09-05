import Layout from "../Components/Layout";

export default function TransactionsPage() {
  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• FINANCIAL OVERVIEW</p>
          <h1 className="text-3xl font-semibold">Transactions</h1>
          <p className="text-gray-500 mt-2">Types: RENT, ELECTRICITY, GAS, WATER, SERVICE_CHARGE, PARKING, WORK_ORDER_COST.</p>
        </div>
      </section>
    </Layout>
  );
}