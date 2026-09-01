import React from 'react';
import PortfolioCard from './generative/PortfolioCard';
import TickerChartCard from './generative/TickerChartCard';
import WatchlistWidget from './generative/WatchlistWidget';
import CrisisScenarioCard from './generative/CrisisScenarioCard';
import ArbitrageCard from './generative/ArbitrageCard';

/**
 * MessageWidgetRenderer
 * Inspects message payloads and safely mounts appropriate Generative UI widgets
 */
const MessageWidgetRenderer = ({ widgetType, widgetData }) => {
  if (!widgetType) return null;

  switch (widgetType) {
    case 'portfolio':
    case 'portfolio_card':
      return <PortfolioCard data={widgetData} />;

    case 'ticker_chart':
    case 'chart':
      return <TickerChartCard data={widgetData} />;

    case 'watchlist':
    case 'watchlist_widget':
      return <WatchlistWidget data={widgetData} />;

    case 'crisis_scenarios':
    case 'crisis_simulation':
      return <CrisisScenarioCard data={widgetData} />;

    case 'arbitrage':
    case 'arbitrage_detector':
      return <ArbitrageCard data={widgetData} />;

    default:
      console.warn(`[MessageWidgetRenderer] Unknown widget type: ${widgetType}`);
      return null;
  }
};

export default MessageWidgetRenderer;
