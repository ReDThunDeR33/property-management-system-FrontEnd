import Layout from "../Components/Layout";

export default function WorkersPage() {
  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• WORKER DIRECTORY</p>
          <h1 className="text-3xl font-semibold">Workers</h1>
          <p className="text-gray-500 mt-2">From ERD: workers are registered by staff and dispatched to work orders.</p>
        </div>
      </section>
    </Layout>
  );
}