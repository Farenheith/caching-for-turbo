import { readFile } from 'fs/promises'
import { serverLogFile, serverPort } from './lib/constants'
import { core } from './lib/core'
import { existsSync } from 'fs'

/**
 * The post script for the action.
 */
async function post(): Promise<void> {
  try {
    //* Try to kill the server gracefully
    try {
      await fetch(`http://localhost:${serverPort}/shutdown`, {
        method: 'DELETE'
      })
    } catch (error) {
      // Server might already be down, continue anyway
      core.debug(`Server shutdown request failed: ${error}`)
    }

    //* Wait a bit for logs to flush to disk
    await new Promise(resolve => setTimeout(resolve, 2000))

    //* Read and print the logs
    if (existsSync(serverLogFile)) {
      try {
        const logs = await readFile(serverLogFile, 'utf-8')
        if (logs && logs.trim()) {
          core.info('\n╔════════════════════════════════════════╗')
          core.info('║     TURBOGHA SERVER LOGS                ║')
          core.info('╚════════════════════════════════════════╝\n')
          core.info(logs)
          core.info('\n╔════════════════════════════════════════╗')
          core.info('║     END OF SERVER LOGS                  ║')
          core.info('╚════════════════════════════════════════╝\n')
        } else {
          core.warning(`Log file exists but is empty: ${serverLogFile}`)
        }
      } catch (readError) {
        core.warning(`Failed to read log file: ${readError}`)
      }
    } else {
      core.warning(`Server log file not found at: ${serverLogFile}`)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    const message = error instanceof Error ? error.message : String(error)
    core.error(`Error in post action: ${message}`)
    core.setFailed(message)
  }
}

// Run the post script
post()
