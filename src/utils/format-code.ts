import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { existsSync } from 'node:fs'
import prettier, { Options } from 'prettier'

const defaultPrettierConfig: Options = {
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5' as const,
  printWidth: 80,
}

export const formatCode = async (code: string, filePath?: string): Promise<string> => {
  try {
    // Try to find prettier config in the current working directory
    const configPath = resolve(cwd(), '.prettierrc')
    const config = existsSync(configPath)
      ? await prettier.resolveConfig(filePath || configPath)
      : defaultPrettierConfig

    const fileInfo = filePath ? await prettier.getFileInfo(filePath) : { inferredParser: 'babel' }

    return prettier.format(code, {
      ...config,
      parser: fileInfo.inferredParser || 'babel',
    })
  } catch (error) {
    console.error('Error formatting code:', error)
    return code
  }
} 