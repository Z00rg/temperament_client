'use client';

import {UiHeader} from "@/shared/ui/ui-header";
import {CategoryList} from "@/features/category";


export default function HomePage() {

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <UiHeader/>

        <CategoryList/>

      </div>
  );
}