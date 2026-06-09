CREATE TABLE IF NOT EXISTS aic_knowledge_article (
	ArticleTitle TEXT NOT NULL,
	ArticleCode TEXT PRIMARY KEY,
	OfficeCode TEXT NOT NULL,
	CategoryCode TEXT NOT NULL,
	ArticleType TEXT NOT NULL,
	ContentSummary TEXT NOT NULL,
	SourceLink TEXT,
	SafeForSelfService TEXT NOT NULL DEFAULT 'Yes',
	EscalationBoundary TEXT NOT NULL,
	LastVerified TEXT NOT NULL,
	Active TEXT NOT NULL DEFAULT 'Yes'
);

CREATE TABLE IF NOT EXISTS aic_support_ticket (
	TicketNumber TEXT PRIMARY KEY,
	TicketTitle TEXT NOT NULL,
	StudentID TEXT NOT NULL,
	StudentEmail TEXT NOT NULL,
	ResponsibleOfficeCode TEXT NOT NULL,
	CategoryCode TEXT NOT NULL,
	Status TEXT NOT NULL,
	Priority TEXT NOT NULL,
	UrgencyReason TEXT NOT NULL,
	IssueSummary TEXT NOT NULL,
	CollectedInformation TEXT NOT NULL,
	MissingInformation TEXT NOT NULL,
	AttemptedGuidance TEXT NOT NULL,
	EscalationReason TEXT NOT NULL,
	SuggestedStaffAction TEXT NOT NULL,
	ConversationSummary TEXT NOT NULL,
	Channel TEXT NOT NULL,
	AIConfidence REAL NOT NULL,
	ResolvedByAgent TEXT NOT NULL,
	CreatedByAgent TEXT NOT NULL
);
