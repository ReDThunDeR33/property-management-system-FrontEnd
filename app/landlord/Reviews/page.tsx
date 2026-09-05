import Layout from "../Components/Layout";

export default function ReviewsPage() {
  return (
    <Layout>
      <section>
        <div className="mb-8">
          <p className="text-[#FF5A3D] text-sm mb-2">• WORK ORDER REVIEWS</p>
          <h1 className="text-3xl font-semibold">Tenant Reviews</h1>
          <p className="text-gray-500 mt-2">From ERD: review is tied to completed work order and written by tenant.</p>
        </div>
      </section>
    </Layout>
  );
}