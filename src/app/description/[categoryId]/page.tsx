'use client';

import {UiHeader} from "@/shared/ui/ui-header";
import {Category} from "@/features/category";


export default function DescriptionPage() {

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

            {/* Header */}
            <UiHeader/>

            {/* Main Content */}
            <Category/>
        </div>
    );
}