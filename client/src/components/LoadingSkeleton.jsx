// client/src/components/LoadingSkeleton.jsx
/**
 * Reusable loading skeleton components for better UX
 * These components mimic the layout of actual content while it's loading
 */

// Skeleton for generic cards
export function CardSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                    <div className="h-10 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
        </div>
    );
}

// Skeleton for notice board items
export function NoticeSkeleton() {
    return (
        <div className="p-6 border-b border-gray-100 animate-pulse">
            <div className="flex justify-between items-start mb-3">
                <div className="h-5 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-32 mt-4"></div>
        </div>
    );
}

// Skeleton for table rows
export function TableRowSkeleton() {
    return (
        <tr className="animate-pulse">
            <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
            </td>
        </tr>
    );
}

// Skeleton for charts/graphs
export function ChartSkeleton() {
    return (
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-40 mb-6"></div>
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-end space-x-2">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div
                            className="bg-gray-200 rounded"
                            style={{ height: `${Math.random() * 100 + 50}px`, width: '100%' }}
                        ></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
