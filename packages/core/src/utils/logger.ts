import * as winston from 'winston';
const DailyRotateFile = require('winston-daily-rotate-file');
const { combine, timestamp, label, printf } = winston.format;

const logger = winston.createLogger({
	level: 'info',
	format: combine(
		timestamp(),
		winston.format.json()
	),
	defaultMeta: { service: 'stubr' },
	transports: [
		//
		// - Write to all logs with level `info` and below to `combined.log`
		// - Write all logs error (and below) to `error.log`.
		//
		new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
		new DailyRotateFile({
			filename: 'logs/combined.log',
			maxFiles: '2d'
		})
	]
});

const myFormat = printf(({ level, message }) => {
	return `[${level}]: ${message}`;
});

if (process.env.NODE_ENV !== 'production') {
	logger.add(new winston.transports.Console({
		level: 'debug',
		format: combine(
			myFormat
		)
	}));
}

export default logger;
