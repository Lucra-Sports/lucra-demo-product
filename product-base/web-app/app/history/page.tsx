'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getNumberHistory } from '../../lib/api';

export default function HistoryPage() {
  const router = useRouter();
  const userRef = useRef(getCurrentUser());
  const [numbers, setNumbers] = useState<{id: number; value: number; created_at: string;}[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userRef.current) {
      router.push('/auth/login');
      return;
    }

    const fetchNumbers = async () => {
      setLoading(true);
      try {
        const res = await getNumberHistory(page, limit);
        setNumbers(res.numbers);
        setPage(res.page);
        setTotalPages(res.totalPages);
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchNumbers();
  }, [page, limit, router]);

  const changeLimit = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value, 10);
    setLimit(newLimit);
    setPage(1);
  };

  const nextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  if (!userRef.current) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      <div className="bg-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between p-6">
          <Link href="/profile" className="text-white hover:text-white/80 transition-colors">
            <i className="ri-arrow-left-line text-2xl"></i>
          </Link>
          <h1 className="font-['Pacifico'] text-2xl text-white">Number History</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <select
            value={limit}
            onChange={changeLimit}
            className="px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
          >
            <option value={5}>5</option>
            <option value={25}>25</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {numbers.map((n) => (
                <li key={n.id} className="py-2 flex justify-between">
                  <span className="font-medium text-gray-800">{n.value}</span>
                  <span className="text-gray-600 text-sm">{new Date(n.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-white">
            <button
              onClick={prevPage}
              disabled={page === 1}
              className="px-4 py-2 bg-white/20 rounded-xl disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white/20 rounded-xl disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
