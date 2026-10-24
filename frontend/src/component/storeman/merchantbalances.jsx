import React, { useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import "./merchantbalances.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL;
const ENDPOINT = "/getmerchantbalance";

// Make first letter capital
function capitalize(text) {
    if (!text) return "-";
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// Show money like ₹1,500
function formatRupees(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

export default function MerchantBalances() {
    const [merchantsData, setMerchantsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("high");

    // Get data from backend
    async function loadBalances() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(BACKEND + ENDPOINT, {
                method: "GET",
                credentials: "include",
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Could not load merchant balances.");
                return;
            }

            // backend sends: { message, body: [ ... ] }
            setMerchantsData(data.body || []);
        } catch (err) {
            console.log("error in get merchant balances:", err.message);
            setError("Can't reach the server. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    // Run once when the page opens
    useEffect(() => {
        loadBalances();
    }, []);

    // Clean the data
    const merchants = merchantsData.map((b) => {
        const credit = Number(b.totalamount) || 0;
        const paid = Number(b.totalpaid) || 0;

        return {
            id: b._id,
            name: capitalize(b.username),
            phone: b.phonenumber ? String(b.phonenumber) : "",
            credit: credit,          // total credit given
            paid: paid,              // total paid back
            owed: credit - paid,     // still to pay
        };
    });

    // Totals
    const totalOwed = merchants.reduce((sum, m) => sum + m.owed, 0);
    const totalPaid = merchants.reduce((sum, m) => sum + m.paid, 0);
    const owing = merchants.filter((m) => m.owed > 0).length;

    // Search
    const search = query.trim().toLowerCase();
    const list = merchants.filter(
        (m) => m.name.toLowerCase().includes(search) || m.phone.includes(search)
    );

    // Sort
    if (sort === "high") list.sort((a, b) => b.owed - a.owed);
    if (sort === "low") list.sort((a, b) => a.owed - b.owed);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));

    // Message to show instead of the table rows
    let message = "";
    if (loading) message = "Loading merchants…";
    else if (error) message = error;
    else if (merchants.length === 0) message = "No merchants yet.";
    else if (list.length === 0) message = `No merchants match “${query.trim()}”.`;

    return (
        <section className="mb">
            <div className="mb-head">
                <div>
                    <h2>Merchant balances</h2>
                    <p>What each merchant currently owes you.</p>
                </div>

                <div className="mb-figures">
                    <div>
                        <span>Total outstanding</span>
                        <strong className={totalOwed > 0 ? "due" : ""}>{formatRupees(totalOwed)}</strong>
                    </div>
                    <div>
                        <span>Total paid</span>
                        <strong>{formatRupees(totalPaid)}</strong>
                    </div>
                    <div>
                        <span>Merchants</span>
                        <strong>{merchants.length}</strong>
                    </div>
                    <div>
                        <span>With balance</span>
                        <strong>{owing}</strong>
                    </div>
                    <button
                        type="button"
                        className="mb-refresh"
                        onClick={loadBalances}
                        disabled={loading}
                        aria-label="Refresh balances"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? "spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="mb-tools">
                <div className="mb-search">
                    <Search size={16} />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search merchant name or phone"
                        aria-label="Search merchants"
                    />
                </div>

                <select
                    className="mb-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label="Sort merchants"
                >
                    <option value="high">Highest balance first</option>
                    <option value="low">Lowest balance first</option>
                    <option value="name">Name A to Z</option>
                </select>
            </div>

            <div className="mb-scroll">
                <table className="mb-table">
                    <thead>
                        <tr>
                            <th>Merchant</th>
                            <th>Phone</th>
                            <th className="mb-right">Total credit</th>
                            <th className="mb-right">Paid</th>
                            <th className="mb-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {message && (
                            <tr>
                                <td colSpan={5} className="mb-empty">{message}</td>
                            </tr>
                        )}

                        {!message &&
                            list.map((m) => (
                                <tr key={m.id}>
                                    <td>
                                        <div className="mb-who">
                                            <span className="mb-avatar">{m.name.slice(0, 2).toUpperCase()}</span>
                                            <strong>{m.name}</strong>
                                        </div>
                                    </td>
                                    <td className="mb-muted">{m.phone || "-"}</td>
                                    <td className="mb-right">{formatRupees(m.credit)}</td>
                                    <td className="mb-right">{formatRupees(m.paid)}</td>
                                    <td className={"mb-right mb-amount" + (m.owed > 0 ? " due" : "")}>
                                        {formatRupees(m.owed)}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {!message && (
                <div className="mb-foot">
                    Showing {list.length} of {merchants.length}
                </div>
            )}
        </section>
    );
}