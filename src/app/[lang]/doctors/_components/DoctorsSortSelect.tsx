'use client';

export function DoctorsSortSelect({ 
  defaultValue, 
  labels 
}: { 
  defaultValue: string;
  labels: Record<string, string>;
}) {
  return (
    <select
      defaultValue={defaultValue}
      onChange={(e) => {
        const url = new URL(window.location.href);
        url.searchParams.set('sort', e.target.value);
        window.location.href = url.toString();
      }}
      className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
    >
      <option value="">{labels.relevance}</option>
      <option value="rating">{labels.rating}</option>
      <option value="price_asc">{labels.price_asc}</option>
      <option value="price_desc">{labels.price_desc}</option>
      <option value="exp">{labels.experience}</option>
    </select>
  );
}
