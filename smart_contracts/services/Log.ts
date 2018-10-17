import * as Bunyan from 'bunyan';

export const LogFactory = (name: string): Bunyan => {
  return Bunyan.createLogger({
    name,
    serializers: Bunyan.stdSerializers,
  });
};

export const Logger = LogFactory('Smart contracts');
