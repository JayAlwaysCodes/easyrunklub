"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkInMember, type CheckInResult } from "@/server/admin/checkin-actions";

type Recent = {
  key: string;
  name: string;
  membershipNumber: string;
  time: string;
  guests: number;
  walkIn: boolean;
};

type Scanner = { stop: () => Promise<void>; clear: () => void };

const RESULT_STYLES = {
  ok: { box: "border-green-300 bg-green-50 text-green-900", Icon: CheckCircle2 },
  already: { box: "border-yellow-300 bg-yellow-50 text-yellow-900", Icon: AlertTriangle },
  error: { box: "border-red-300 bg-red-50 text-red-900", Icon: XCircle },
} as const;

export function CheckInConsole({
  runId,
  initialCheckedIn,
  initialRsvps,
}: {
  runId: string;
  initialCheckedIn: number;
  initialRsvps: number;
}) {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [counts, setCounts] = useState({ checkedIn: initialCheckedIn, rsvps: initialRsvps });
  const [recent, setRecent] = useState<Recent[]>([]);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);

  const scannerRef = useRef<Scanner | null>(null);
  const busyRef = useRef(false);
  const lastScan = useRef({ code: "", at: 0 });

  const handleCode = useCallback(
    async (code: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);

      try {
        const res = await checkInMember(runId, code);
        setResult(res);
        if (res.checkedIn !== undefined && res.rsvps !== undefined) {
          setCounts({ checkedIn: res.checkedIn, rsvps: res.rsvps });
        }
        if (res.status === "ok") {
          setRecent((previous) =>
            [
              {
                key: `${res.membershipNumber}-${Date.now()}`,
                name: res.name ?? "",
                membershipNumber: res.membershipNumber ?? "",
                time: res.time ?? "",
                guests: res.guests ?? 0,
                walkIn: Boolean(res.walkIn),
              },
              ...previous,
            ].slice(0, 10)
          );
          navigator.vibrate?.(120);
        } else {
          navigator.vibrate?.([80, 60, 80]);
        }
      } catch {
        setResult({
          status: "error",
          message: "Couldn't reach the server. Check your connection and scan again.",
        });
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [runId]
  );

  const onDecode = useCallback(
    (text: string) => {
      if (busyRef.current) return;
      const now = Date.now();
      // The camera sees the same code many times a second; act on it once.
      if (text === lastScan.current.code && now - lastScan.current.at < 4000) return;
      lastScan.current = { code: text, at: now };
      void handleCode(text);
    },
    [handleCode]
  );

  async function startScanner() {
    setCameraError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        onDecode,
        () => {}
      );
      scannerRef.current = scanner;
      setScanning(true);
    } catch {
      setCameraError(
        "Couldn't open the camera. Allow camera access in your browser (it only works on https or localhost), or use the ID box below."
      );
    }
  }

  async function stopScanner() {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch {
      // Already stopped.
    }
    scannerRef.current = null;
    setScanning(false);
  }

  useEffect(() => {
    return () => {
      void scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const style = result ? RESULT_STYLES[result.status] : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-muted/30 p-4 text-center">
        <p className="font-heading text-3xl font-semibold">
          {counts.checkedIn}
          <span className="text-lg font-normal text-muted-foreground"> / {counts.rsvps}</span>
        </p>
        <p className="text-sm text-muted-foreground">checked in / signed up</p>
      </div>

      {style && result && (
        <div role="status" className={`flex items-start gap-3 rounded-2xl border p-4 ${style.box}`}>
          <style.Icon className="mt-0.5 h-6 w-6 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold">{result.message}</p>
            {result.membershipNumber && (
              <p className="text-sm opacity-80">{result.membershipNumber}</p>
            )}
            {result.guests ? (
              <p className="mt-1 text-sm font-medium">
                Bringing {result.guests} guest{result.guests === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {cameraError && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {cameraError}
          </p>
        )}

        {/* Always present: the scanner draws its video into this box. */}
        <div id="qr-reader" className="mx-auto w-full max-w-sm overflow-hidden rounded-xl" />

        {scanning ? (
          <Button type="button" variant="outline" onClick={stopScanner} className="w-full rounded-full">
            <CameraOff className="mr-2 h-4 w-4" />
            Stop camera
          </Button>
        ) : (
          <Button
            type="button"
            onClick={startScanner}
            className="w-full rounded-full bg-brand-green text-white hover:bg-brand-green/90"
          >
            <Camera className="mr-2 h-4 w-4" />
            Start scanning
          </Button>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (manual.trim()) void handleCode(manual);
          setManual("");
        }}
        className="space-y-2"
      >
        <label htmlFor="manual-id" className="text-sm font-medium">
          Or type the Membership ID
        </label>
        <div className="flex gap-2">
          <Input
            id="manual-id"
            value={manual}
            onChange={(event) => setManual(event.target.value)}
            placeholder="ERK-000007"
            autoCapitalize="characters"
            autoComplete="off"
          />
          <Button type="submit" disabled={busy} variant="outline" className="rounded-full">
            Check in
          </Button>
        </div>
      </form>

      {recent.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Checked in this session</p>
          <ul className="divide-y rounded-2xl border">
            {recent.map((entry) => (
              <li key={entry.key} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.membershipNumber}
                    {entry.walkIn ? " · walk-in" : ""}
                    {entry.guests > 0 ? ` · +${entry.guests} guest${entry.guests === 1 ? "" : "s"}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{entry.time}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}