var BACKEND_URL = 'https://explainly-backend-dev.vercel.app';
var SUPABASE_URL = 'https://sxvezdyfbvlpeirzbjho.supabase.co';
var SUPABASE_ANON_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dmV6ZHlmYnZscGVpcnpiamhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NDMwMTgsImV4cCI6MjA5MjIxOTAxOH0.eYtm5bXzUimtOX1xrfGXp87gn-TvFhwE7xIWkbT5It0';

var PAYMENT_LINKS = {
	razorpay: {
		pro: 'https://pages.razorpay.com/pl_SuR9cCkdLNoPP6/view',
		premium: 'https://pages.razorpay.com/pl_SuRI6LVLwdxDN4/view',
		premium_yearly: 'https://pages.razorpay.com/pl_SuRJXGXtHr3wLm/view',
	},
};

var PADDLE_CLIENT_TOKEN = 'live_1fc0c20bc0286f0bf91bba130b6';

var PADDLE_PRICE_IDS = {
	pro: 'pri_01ksckjz43htt6wyb4g1fwghve',
	premium: 'pri_01ksmsawx6j2gs2dzf0at6zrps',
	premium_yearly: 'pri_01ksms9t6sbas9v6dbh8v3z7ed',
};

var TIER_LIMITS = {
	free:    { daily: 15,  deep: 2,  why: 1  },
	pro:     { daily: 100, deep: 10, why: 10 },
	premium: { daily: 500, deep: 75, why: 75 },
};

var TIER_ORDER = { free: 0, pro: 1, premium: 2 };
