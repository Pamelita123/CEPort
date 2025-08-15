import {
  Component,
  signal,
  computed,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CardComponent } from '@layouts/card/card.component';
import { StatusTagComponent } from '@layouts/tag/status-tag.component';
import { LoaderComponent } from '@components/loader/loader';
import { getCurrentUserFromToken } from '@services/auth/auth.service';
import { UserAttributes } from '@expressModels/users/users';
import { NavBar } from '@components/navBar/navBar';
import { FeedsService } from '@services/feeds/feeds.service';
import { firstValueFrom } from 'rxjs';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CardComponent, StatusTagComponent, LoaderComponent, NavBar],
  standalone: true,
})
export class DashboardComponent implements OnDestroy, AfterViewInit {
  username = signal<UserAttributes | string>('');

  gasValue = signal<number | null>(null);
  gasUpdatedAt = signal<string | null>(null);
  gasStatusText = computed(() => {
    const v = this.gasValue();
    return v !== null
      ? this.feedsService.getStatusText('gas-sensor', v)
      : 'Sin datos';
  });

  tempValue = signal<number | null>(null);
  tempUpdatedAt = signal<string | null>(null);
  tempStatusText = computed(() => {
    const v = this.tempValue();
    return v !== null
      ? this.feedsService.getStatusText('temperature', v)
      : 'Sin datos';
  });

  humidityValue = signal<number | null>(null);
  humidityUpdatedAt = signal<string | null>(null);

  soundValue = signal<number | null>(null);
  soundUpdatedAt = signal<string | null>(null);
  soundStatusText = computed(() => {
    const v = this.soundValue();
    return v !== null
      ? this.feedsService.getStatusText('sound-sensor', v)
      : 'Sin datos';
  });

  motionValue = signal<number | null>(null);
  motionUpdatedAt = signal<string | null>(null);
  motionStatusText = computed(() => {
    const v = this.motionValue();
    return v !== null
      ? this.feedsService.getStatusText('motion-detector', v)
      : 'Sin datos';
  });

  ul1Value = signal<number | null>(null);
  ul1UpdatedAt = signal<string | null>(null);
  ul2Value = signal<number | null>(null);
  ul2UpdatedAt = signal<string | null>(null);

  latestUpdate = computed(() => {
    const dates = [
      this.gasUpdatedAt(),
      this.tempUpdatedAt(),
      this.humidityUpdatedAt(),
      this.soundUpdatedAt(),
      this.motionUpdatedAt(),
    ]
      .filter((d): d is string => !!d)
      .map((d) => new Date(d).getTime());
    if (!dates.length) return null;
    const max = Math.max(...dates);
    return new Date(max).toLocaleString();
  });

  @ViewChild('charger1Chart') charger1ChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('charger2Chart') charger2ChartRef!: ElementRef<HTMLCanvasElement>;

  private charger1Chart?: Chart;
  private charger2Chart?: Chart;
  private chartPollId: any;
  private pollId: any;

  constructor(private feedsService: FeedsService) {}

  async ngOnInit(): Promise<void> {
    const user = await getCurrentUserFromToken();
    if (!user) {
      this.username.set('');
      return;
    }
    this.username.set(
      user.username.charAt(0).toUpperCase() + user.username.substring(1)
    );

    await Promise.all([
      this.loadGas(),
      this.loadTemperature(),
      this.loadHumidity(),
      this.loadSound(),
      this.loadMotion(),
      this.loadUltrasonic('ultrasonic-distance', 'ul1'),
      this.loadUltrasonic('ultrasonic-distance2', 'ul2'),
    ]);

    this.pollId = setInterval(() => {
      this.loadGas();
      this.loadTemperature();
      this.loadHumidity();
      this.loadSound();
      this.loadMotion();
      this.loadUltrasonic('ultrasonic-distance', 'ul1');
      this.loadUltrasonic('ultrasonic-distance2', 'ul2');
    }, 30000);
  }

  ngAfterViewInit(): void {
    this.loadChargerCharts();
    this.chartPollId = setInterval(() => this.loadChargerCharts(), 30000);
  }

  ngOnDestroy(): void {
    if (this.pollId) clearInterval(this.pollId);
    if (this.chartPollId) clearInterval(this.chartPollId);
    this.charger1Chart?.destroy();
    this.charger2Chart?.destroy();
  }

  private async loadGas() {
    try {
      const feed = await firstValueFrom(
        this.feedsService.getFeed('gas-sensor')
      );
      const val = feed?.last_value != null ? Number(feed.last_value) : null;
      this.gasValue.set(
        Number.isFinite(val as number) ? (val as number) : null
      );
      this.gasUpdatedAt.set(
        feed?.updated_at ? this.formatDate(feed.updated_at) : null
      );
    } catch {
      this.gasValue.set(null);
      this.gasUpdatedAt.set(null);
    }
  }

  private async loadTemperature() {
    try {
      const feed = await firstValueFrom(
        this.feedsService.getFeed('temperature')
      );
      const val = feed?.last_value != null ? Number(feed.last_value) : null;
      this.tempValue.set(
        Number.isFinite(val as number) ? (val as number) : null
      );
      this.tempUpdatedAt.set(
        feed?.updated_at ? this.formatDate(feed.updated_at) : null
      );
    } catch {
      this.tempValue.set(null);
      this.tempUpdatedAt.set(null);
    }
  }

  private async loadHumidity() {
    try {
      const feed = await firstValueFrom(this.feedsService.getFeed('humidity'));
      const val = feed?.last_value != null ? Number(feed.last_value) : null;
      this.humidityValue.set(
        Number.isFinite(val as number) ? (val as number) : null
      );
      this.humidityUpdatedAt.set(
        feed?.updated_at ? this.formatDate(feed.updated_at) : null
      );
    } catch {
      this.humidityValue.set(null);
      this.humidityUpdatedAt.set(null);
    }
  }

  private async loadSound() {
    try {
      const feed = await firstValueFrom(
        this.feedsService.getFeed('sound-sensor')
      );
      const val = feed?.last_value != null ? Number(feed.last_value) : null;
      this.soundValue.set(
        Number.isFinite(val as number) ? (val as number) : null
      );
      this.soundUpdatedAt.set(
        feed?.updated_at ? this.formatDate(feed.updated_at) : null
      );
    } catch {
      this.soundValue.set(null);
      this.soundUpdatedAt.set(null);
    }
  }

  private async loadMotion() {
    try {
      const feed = await firstValueFrom(
        this.feedsService.getFeed('motion-detector')
      );
      const val = feed?.last_value != null ? Number(feed.last_value) : null; // expected 0/1
      this.motionValue.set(
        Number.isFinite(val as number) ? (val as number) : null
      );
      this.motionUpdatedAt.set(
        feed?.updated_at ? this.formatDate(feed.updated_at) : null
      );
    } catch {
      this.motionValue.set(null);
      this.motionUpdatedAt.set(null);
    }
  }

  private async loadUltrasonic(
    feedKey: 'ultrasonic-distance' | 'ultrasonic-distance2',
    which: 'ul1' | 'ul2'
  ) {
    try {
      const feed = await firstValueFrom(this.feedsService.getFeed(feedKey));
      const val = feed?.last_value != null ? Number(feed.last_value) : null;
      const parsed = Number.isFinite(val as number) ? (val as number) : null;
      const when = feed?.updated_at ? this.formatDate(feed.updated_at) : null;

      if (which === 'ul1') {
        this.ul1Value.set(parsed);
        this.ul1UpdatedAt.set(when);
      } else {
        this.ul2Value.set(parsed);
        this.ul2UpdatedAt.set(when);
      }
    } catch {
      if (which === 'ul1') {
        this.ul1Value.set(null);
        this.ul1UpdatedAt.set(null);
      } else {
        this.ul2Value.set(null);
        this.ul2UpdatedAt.set(null);
      }
    }
  }

  private async loadChargerCharts() {
    await Promise.all([
      this.loadUsageFor('ultrasonic-distance', 'charger1'),
      this.loadUsageFor('ultrasonic-distance2', 'charger2'),
    ]);
  }

  private async loadUsageFor(
    feedKey: 'ultrasonic-distance' | 'ultrasonic-distance2',
    which: 'charger1' | 'charger2'
  ) {
    try {
      const chartData = await firstValueFrom(
        this.feedsService.getChartData(feedKey, 24)
      );
      const { labels, values } = this.buildUsageSeries(chartData);
      this.renderUsageChart(which, labels, values);
    } catch {
      const { labels, values } = this.buildEmptySeries();
      this.renderUsageChart(which, labels, values);
    }
  }

private buildUsageSeries(cd: { data: Array<{ timestamp: string; value: number }> }) {
    if (!cd || !Array.isArray(cd.data) || cd.data.length === 0) {
      return this.buildEmptySeries();
    }

    // Sort ASC by time
    const points = [...cd.data].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Last 24h window (floored to the hour)
    const now = new Date();
    const start = new Date(now);
    start.setHours(now.getHours() - 23, 0, 0, 0);

    // bucket: hourStart(ms) -> detection count
    const counts = new Map<number, number>();

    // Count a detection when we transition from "no data" (<= 0) to "data" (> 0)
    let prevHasValue = false;
    for (const p of points) {
      const ts = new Date(p.timestamp);
      if (ts < start || ts > now) continue;

      const hasValue = typeof p.value === 'number' && p.value > 0;
      if (hasValue && !prevHasValue) {
        const hourStart = new Date(ts);
        hourStart.setMinutes(0, 0, 0);
        const key = hourStart.getTime();
        counts.set(key, Math.min(20, (counts.get(key) || 0) + 1));
      }
      prevHasValue = hasValue;
    }

    // Build labels/values only for hours that have detections
    const labels: string[] = [];
    const values: number[] = [];
    for (let i = 0; i < 24; i++) {
      const bucket = new Date(start.getTime() + i * 60 * 60 * 1000);
      const key = bucket.getTime();
      const c = counts.get(key) || 0;
      if (c > 0) {
        labels.push(`${bucket.getHours().toString().padStart(2, '0')}:00`);
        values.push(c);
      }
    }

    return { labels, values };
  }


private buildEmptySeries() {
    return { labels: [] as string[], values: [] as number[] };
  }

private renderUsageChart(
  which: 'charger1' | 'charger2',
  labels: string[],
  values: number[]
) {
  const ctx =
    which === 'charger1'
      ? this.charger1ChartRef?.nativeElement?.getContext('2d')
      : this.charger2ChartRef?.nativeElement?.getContext('2d');
  if (!ctx) return;

  const color = '#D6FF41';
  const grid = 'rgba(255,255,255,0.08)';
  const maxY = values.length ? Math.max(...values) : 1;

  const config = {
    type: 'line' as const,
    data: {
      labels,
      datasets: [
        {
          label: 'Carros Detectados Por Hora',
          data: values,
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          // stepped line
          stepped: true,
          tension: 0,
          fill: false,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        axis: 'x'
      },
      scales: {
        x: {
          grid: { color: grid },
          ticks: { color: '#fff', maxRotation: 0, autoSkip: true }
        },
        y: {
          beginAtZero: true,
          max: maxY + 1,
          suggestedMax: maxY + 1,
          grid: { color: grid },
          ticks: { color: '#fff', stepSize: 1 }
        }
      },
      plugins: {
        legend: { labels: { color: '#fff' } },
        tooltip: {
          titleColor: '#fff',
          bodyColor: '#fff',
          backgroundColor: 'rgba(0,0,0,0.8)'
        }
      }
    }
  };

  if (which === 'charger1') {
    if (this.charger1Chart && (this.charger1Chart.config as any).type !== 'line') {
      this.charger1Chart.destroy();
      this.charger1Chart = undefined;
    }
    if (this.charger1Chart) {
      this.charger1Chart.data.labels = labels;
      this.charger1Chart.data.datasets[0].data = values as any;
      // keep stepped mode on update
      (this.charger1Chart.data.datasets[0] as any).stepped = true;
      (this.charger1Chart.data.datasets[0] as any).tension = 0;
      (this.charger1Chart.options.scales as any).y.max = maxY;
      (this.charger1Chart.options.scales as any).y.suggestedMax = maxY;
      this.charger1Chart.update();
    } else {
      this.charger1Chart = new Chart(ctx, config as any);
    }
  } else {
    if (this.charger2Chart && (this.charger2Chart.config as any).type !== 'line') {
      this.charger2Chart.destroy();
      this.charger2Chart = undefined;
    }
    if (this.charger2Chart) {
      this.charger2Chart.data.labels = labels;
      this.charger2Chart.data.datasets[0].data = values as any;
      (this.charger2Chart.data.datasets[0] as any).stepped = true;
      (this.charger2Chart.data.datasets[0] as any).tension = 0;
      (this.charger2Chart.options.scales as any).y.max = maxY;
      (this.charger2Chart.options.scales as any).y.suggestedMax = maxY;
      this.charger2Chart.update();
    } else {
      this.charger2Chart = new Chart(ctx, config as any);
    }
  }
}

  private formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString();
  }
}
