import Layout from "../Components/Layout";

export default function WorkOrdersPage() {
  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• MAINTENANCE MANAGEMENT</p>
          <h1 className="text-3xl font-semibold">Work Orders</h1>
          <p className="text-gray-500 mt-2">Create and track work orders from issues.</p>
        </div>
      </section>
    </Layout>
  );
}