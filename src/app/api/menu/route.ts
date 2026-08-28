import { NextResponse } from "next/server";
import { MENU, store } from "@/lib/store";

export async function GET() {
  const s = store();
  return NextResponse.json({
    menu: MENU.filter((m) => m.active),
    stall: {
      openToday: s.openToday,
      note: s.openNote,
      simDate: s.simDate.toISOString(),
    },
  });
}
