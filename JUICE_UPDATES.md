// client/src/pages/Dashboard.jsx - Juice Card Addition
// Insert this after the Coffee card (around line 150)

{/* Juice Card */}
<div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500 hover:shadow-md transition">
  <div className="flex justify-between items-center">
    <div>
      <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Juice</h3>
      <p className="text-4xl font-extrabold text-gray-800 mt-2">{stats.juice}</p>
    </div>
    <button 
      onClick={() => handleOrder('juice')}
      disabled={loading}
      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 font-medium"
    >
      + Order Juice
    </button>
  </div>
</div>
