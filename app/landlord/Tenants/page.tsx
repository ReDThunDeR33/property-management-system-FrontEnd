import Layout from "../Components/Layout";

export default function TenantsPage() {
  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• TENANT MANAGEMENT</p>
          <h1 className="text-3xl font-semibold">Tenants</h1>
          <p className="text-gray-500 mt-2">As per routes: get tenants by landlord, approve tenant, reject tenant.</p>
        </div>
      </section>
    </Layout>
  );
}